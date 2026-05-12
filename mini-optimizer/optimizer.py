from __future__ import annotations

import numpy as np
import pandas as pd


REQUIRED_COLUMNS = ["trade_id", "entry_time", "exit_time", "pnl", "mae", "mfe"]


def _compute_sharpe(adjusted_pnl: np.ndarray) -> float:
    """Return simplified Sharpe ratio using population std."""
    if adjusted_pnl.size <= 1:
        return 0.0

    std = float(np.std(adjusted_pnl, ddof=0))
    if std == 0.0:
        return 0.0

    mean = float(np.mean(adjusted_pnl))
    return float(mean / std)


def optimize(
    trades_df: pd.DataFrame,
    stop_losses: list[float],
    take_profits: list[float],
    top_n: int = 5,
) -> list[dict]:
    if trades_df.empty or not stop_losses or not take_profits:
        return []

    clean_df = trades_df.dropna(subset=["pnl", "mae", "mfe"])
    if clean_df.empty:
        return []

    pnl = clean_df["pnl"].to_numpy(dtype=float, copy=False)
    mae = clean_df["mae"].to_numpy(dtype=float, copy=False)
    mfe = clean_df["mfe"].to_numpy(dtype=float, copy=False)

    results: list[dict] = []

    for sl_value in stop_losses:
        sl = float(sl_value)
        sl_hit = mae >= sl

        for tp_value in take_profits:
            tp = float(tp_value)
            tp_hit = mfe >= tp
            adjusted = np.where(sl_hit, -sl, np.where(tp_hit, tp, pnl))

            total_pnl = float(np.sum(adjusted))
            stopped_out = int(np.count_nonzero(sl_hit))
            took_profit = int(np.count_nonzero(~sl_hit & tp_hit))
            sharpe = _compute_sharpe(adjusted)

            results.append(
                {
                    "stop_loss": float(sl),
                    "take_profit": float(tp),
                    "sharpe": float(sharpe),
                    "total_pnl": float(total_pnl),
                    "stopped_out": int(stopped_out),
                    "took_profit": int(took_profit),
                }
            )

    results.sort(
        key=lambda item: (
            -item["sharpe"],
            -item["total_pnl"],
            item["stop_loss"],
            item["take_profit"],
        )
    )

    if top_n <= 0:
        return []
    return results[:top_n]
