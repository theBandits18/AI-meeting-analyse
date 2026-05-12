from __future__ import annotations

import math
import time

import numpy as np
import pandas as pd

from optimizer import optimize


def T(*rows) -> pd.DataFrame:
    """Build trades DataFrame from (pnl, mae, mfe) tuples."""
    data = []
    for idx, (pnl, mae, mfe) in enumerate(rows, start=1):
        data.append(
            {
                "trade_id": idx,
                "entry_time": pd.Timestamp("2024-01-01 09:30:00") + pd.Timedelta(days=idx - 1),
                "exit_time": pd.Timestamp("2024-01-01 10:00:00") + pd.Timedelta(days=idx - 1),
                "pnl": pnl,
                "mae": mae,
                "mfe": mfe,
            }
        )
    return pd.DataFrame(data, columns=["trade_id", "entry_time", "exit_time", "pnl", "mae", "mfe"])


def test_result_structure():
    trades = T((10.0, 2.0, 8.0), (-4.0, 6.0, 1.0), (3.0, 1.0, 5.0))
    results = optimize(trades, stop_losses=[2.0, 5.0], take_profits=[4.0, 9.0], top_n=4)

    assert isinstance(results, list)
    assert results

    expected_keys = {
        "stop_loss",
        "take_profit",
        "sharpe",
        "total_pnl",
        "stopped_out",
        "took_profit",
    }

    for item in results:
        assert set(item.keys()) == expected_keys
        assert isinstance(item["stop_loss"], float)
        assert isinstance(item["take_profit"], float)
        assert isinstance(item["sharpe"], float)
        assert isinstance(item["total_pnl"], float)
        assert isinstance(item["stopped_out"], int)
        assert isinstance(item["took_profit"], int)


def test_sl_tp_applied_correctly():
    trades = T((10.0, 2.0, 15.0), (-8.0, 10.0, 1.0), (3.0, 6.0, 20.0), (4.0, 1.0, 3.0))
    results = optimize(trades, stop_losses=[5.0], take_profits=[12.0], top_n=1)

    assert len(results) == 1
    result = results[0]
    assert result["total_pnl"] == 6.0
    assert result["stopped_out"] == 2
    assert result["took_profit"] == 1
    assert math.isclose(result["sharpe"], 0.2116, abs_tol=0.001)


def test_ordering_best_sharpe_first():
    trades = T(
        (12.0, 1.0, 15.0),
        (9.0, 2.0, 12.0),
        (7.0, 3.0, 10.0),
        (6.0, 1.0, 8.0),
        (5.0, 2.0, 7.0),
        (-4.0, 5.0, 1.0),
        (-5.0, 6.0, 2.0),
        (-6.0, 7.0, 1.0),
        (-7.0, 8.0, 2.0),
        (-8.0, 9.0, 1.0),
    )
    results = optimize(trades, stop_losses=[2.0, 5.0, 8.0], take_profits=[4.0, 9.0, 14.0], top_n=5)

    sharpes = [item["sharpe"] for item in results]
    assert sharpes == sorted(sharpes, reverse=True)


def test_single_trade_degenerate_sharpe():
    trades = T((5.0, 1.0, 2.0))
    result = optimize(trades, stop_losses=[2.0], take_profits=[3.0], top_n=1)[0]

    assert result["sharpe"] == 0.0
    assert math.isfinite(result["sharpe"])


def test_zero_std_sharpe():
    trades = T((10.0, 5.0, 20.0), (9.0, 6.0, 10.0), (8.0, 7.0, 9.0))
    result = optimize(trades, stop_losses=[5.0], take_profits=[12.0], top_n=1)[0]

    assert result["stopped_out"] == 3
    assert result["sharpe"] == 0.0
    assert math.isfinite(result["sharpe"])


def test_grid_smaller_than_top_n_returns_all():
    trades = T((2.0, 1.0, 3.0), (-1.0, 2.0, 1.0))
    results = optimize(trades, stop_losses=[1.0, 2.0], take_profits=[3.0], top_n=5)

    assert len(results) == 2


def test_empty_dataframe_returns_empty():
    trades = pd.DataFrame(columns=["trade_id", "entry_time", "exit_time", "pnl", "mae", "mfe"])
    assert optimize(trades, stop_losses=[1.0], take_profits=[2.0], top_n=5) == []


def test_empty_stop_losses_returns_empty():
    trades = T((1.0, 0.5, 2.0))
    assert optimize(trades, stop_losses=[], take_profits=[2.0], top_n=5) == []


def test_empty_take_profits_returns_empty():
    trades = T((1.0, 0.5, 2.0))
    assert optimize(trades, stop_losses=[1.0], take_profits=[], top_n=5) == []


def test_nan_rows_are_dropped():
    clean = T((10.0, 2.0, 15.0), (-8.0, 10.0, 1.0), (4.0, 1.0, 3.0))
    dirty_row = pd.DataFrame(
        [
            {
                "trade_id": 99,
                "entry_time": pd.Timestamp("2024-02-01 09:30:00"),
                "exit_time": pd.Timestamp("2024-02-01 10:00:00"),
                "pnl": np.nan,
                "mae": 2.0,
                "mfe": 5.0,
            }
        ]
    )
    dirty = pd.concat([clean, dirty_row], ignore_index=True)

    clean_result = optimize(clean, stop_losses=[5.0], take_profits=[12.0], top_n=1)[0]
    dirty_result = optimize(dirty, stop_losses=[5.0], take_profits=[12.0], top_n=1)[0]

    assert dirty_result["total_pnl"] == clean_result["total_pnl"]
    assert dirty_result["stopped_out"] == clean_result["stopped_out"]


def test_performance_1024_trials():
    rng = np.random.default_rng(seed=42)
    n = 5000
    pnl = rng.normal(loc=0.5, scale=10.0, size=n)
    mae = rng.uniform(0.0, 20.0, size=n)
    mfe = rng.uniform(0.0, 25.0, size=n)
    trades = pd.DataFrame(
        {
            "trade_id": np.arange(1, n + 1),
            "entry_time": pd.date_range("2024-01-01", periods=n, freq="min"),
            "exit_time": pd.date_range("2024-01-01 00:01:00", periods=n, freq="min"),
            "pnl": pnl,
            "mae": mae,
            "mfe": mfe,
        }
    )

    start = time.perf_counter()
    results = optimize(trades, stop_losses=list(range(1, 33)), take_profits=list(range(1, 33)), top_n=5)
    elapsed = time.perf_counter() - start

    assert elapsed < 30.0
    assert len(results) == 5
