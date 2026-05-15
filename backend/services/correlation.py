from typing import List

import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import dendrogram, linkage
from scipy.spatial.distance import squareform

from models.responses import CorrelationResponse, DendrogramData
from services.alpaca_data import get_prices


def compute_correlation(tickers: List[str], period_days: int) -> CorrelationResponse:
    prices = get_prices(tickers, period_days)

    # Use only tickers that survived the NaN filter
    available = [t for t in tickers if t in prices.columns]
    prices = prices[available]

    returns = prices.pct_change().dropna()
    corr = returns.corr(method="pearson")

    # Convert to distance matrix for clustering (1 - |corr|)
    dist = 1 - corr.abs()
    np.fill_diagonal(dist.values, 0.0)
    condensed = squareform(dist.values, checks=False)
    condensed = np.clip(condensed, 0, None)  # numerical safety

    Z = linkage(condensed, method="ward")

    n = len(available)

    def _extract_dendro(Z, labels):
        d = dendrogram(Z, labels=labels, no_plot=True, orientation="top")
        # Rescale icoord from scipy's 0..10*N range to 0..N-1 for Plotly alignment
        scale = (n - 1) / (10.0 * n) if n > 1 else 1.0
        icoord_scaled = [[v * scale for v in row] for row in d["icoord"]]
        dcoord_scaled = [[v for v in row] for row in d["dcoord"]]
        return DendrogramData(
            icoord=icoord_scaled,
            dcoord=dcoord_scaled,
            ivl=d["ivl"],
        )

    dendro_col = _extract_dendro(Z, available)
    leaf_order = [available.index(label) for label in dendro_col.ivl]

    # Reorder correlation matrix by clustering leaf order
    corr_reordered = corr.iloc[leaf_order, leaf_order]
    tickers_ordered = dendro_col.ivl

    # Row dendrogram uses same linkage (symmetric matrix)
    dendro_row = _extract_dendro(Z, available)

    return CorrelationResponse(
        tickers_ordered=tickers_ordered,
        correlation_matrix=corr_reordered.values.tolist(),
        dendrogram_row=dendro_row,
        dendrogram_col=dendro_col,
    )
