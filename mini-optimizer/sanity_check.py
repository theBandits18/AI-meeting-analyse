from __future__ import annotations

import math

import pandas as pd

from optimizer import optimize


def main() -> None:
    trades = pd.DataFrame(
        [
            {
                "trade_id": 1,
                "entry_time": pd.Timestamp("2024-01-01 09:30:00"),
                "exit_time": pd.Timestamp("2024-01-01 10:00:00"),
                "pnl": 10.0,
                "mae": 2.0,
                "mfe": 15.0,
            },
            {
                "trade_id": 2,
                "entry_time": pd.Timestamp("2024-01-02 09:30:00"),
                "exit_time": pd.Timestamp("2024-01-02 10:00:00"),
                "pnl": -8.0,
                "mae": 10.0,
                "mfe": 1.0,
            },
            {
                "trade_id": 3,
                "entry_time": pd.Timestamp("2024-01-03 09:30:00"),
                "exit_time": pd.Timestamp("2024-01-03 10:00:00"),
                "pnl": 3.0,
                "mae": 6.0,
                "mfe": 20.0,
            },
            {
                "trade_id": 4,
                "entry_time": pd.Timestamp("2024-01-04 09:30:00"),
                "exit_time": pd.Timestamp("2024-01-04 10:00:00"),
                "pnl": 4.0,
                "mae": 1.0,
                "mfe": 3.0,
            },
        ]
    )

    results = optimize(trades, stop_losses=[5.0], take_profits=[12.0], top_n=1)
    if not results:
        print("FAIL ✗")
        raise SystemExit(1)

    result = results[0]
    expected = {
        "stop_loss": 5.0,
        "take_profit": 12.0,
        "total_pnl": 6.0,
        "stopped_out": 2,
        "took_profit": 1,
    }
    expected_sharpe = 0.2116
    tolerance = 0.001

    checks = [
        ("stop_loss", result["stop_loss"] == expected["stop_loss"]),
        ("take_profit", result["take_profit"] == expected["take_profit"]),
        ("total_pnl", result["total_pnl"] == expected["total_pnl"]),
        ("stopped_out", result["stopped_out"] == expected["stopped_out"]),
        ("took_profit", result["took_profit"] == expected["took_profit"]),
        (
            "sharpe",
            math.isclose(result["sharpe"], expected_sharpe, abs_tol=tolerance),
        ),
    ]

    for field, passed in checks:
        marker = "✓" if passed else "✗"
        if field == "sharpe":
            print(f"{marker} {field:12s} = {result[field]:.4f} (expected ≈ {expected_sharpe:.4f})")
        else:
            print(f"{marker} {field:12s} = {result[field]}")

    overall = all(passed for _, passed in checks)
    print("PASS ✓" if overall else "FAIL ✗")
    if not overall:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
