# Mini Optimizer Notes

## Approach

The implementation uses a hybrid grid-search strategy: Python loops over the parameter grid, while NumPy vectorises the per-trade calculations. That gives us the best of both worlds. The outer grid is usually modest in size and easy to express as nested loops, while the expensive work is applying each `(stop_loss, take_profit)` pair across every trade. For that part, the code extracts `pnl`, `mae`, and `mfe` arrays once, then evaluates each candidate with a vectorised expression:

```python
sl_hit = mae >= sl
tp_hit = mfe >= tp
adjusted = np.where(sl_hit, -sl, np.where(tp_hit, tp, pnl))
```

This one-liner encodes the three-branch rule exactly and preserves stop-loss priority. If both thresholds are hit on the same trade, the first `np.where` wins and the adjusted PnL becomes `-sl`. That same priority is also used when counting `took_profit`, which only includes `~sl_hit & tp_hit`.

## Trade-Offs

- Hybrid loop instead of full 3-D broadcast: a full `sl x tp x trades` tensor would work mathematically, but it scales memory badly and is unnecessary for a 1024-point sweep. Reusing one vectorised trade pass per combo is much safer.
- Python `sort()` with a tuple key: the ranking rules have three deterministic tie-breakers, so a tuple key keeps the logic readable and stable.
- Explicit `float()` and `int()` casts: NumPy often returns scalar subclasses like `np.float64`; casting ensures the public API returns native Python types, which the tests check directly.

## Edge Cases Handled

- Empty `trades_df`: returns `[]` immediately.
- Empty `stop_losses`: returns `[]` immediately.
- Empty `take_profits`: returns `[]` immediately.
- Rows with NaN in `pnl`, `mae`, or `mfe`: dropped silently with `dropna`.
- Single trade: Sharpe is forced to `0.0`.
- All adjusted PnLs identical: population standard deviation is `0`, so Sharpe is forced to `0.0`.
- Grid smaller than `top_n`: slicing returns only the available combinations, with no padding.

## What I’d Do With Another Day

- Add a coarse-to-fine search mode so very large SL/TP spaces can be scanned faster than a uniform dense grid.
- Report bootstrap confidence intervals for Sharpe so the ranking is less sensitive to sampling noise.
- Add multi-objective reporting, such as a Pareto front for Sharpe, total PnL, and drawdown-style penalties.
- Expand the test suite with property-based tests using Hypothesis to stress priority ordering and edge conditions automatically.
