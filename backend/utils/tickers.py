from typing import List, Dict

SP500_UNIVERSE: List[Dict[str, str]] = [
    # Technology
    {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "sector": "Technology"},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "sector": "Technology"},
    {"symbol": "GOOGL", "name": "Alphabet Inc. Class A", "sector": "Technology"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "sector": "Technology"},
    {"symbol": "AVGO", "name": "Broadcom Inc.", "sector": "Technology"},
    {"symbol": "ORCL", "name": "Oracle Corp.", "sector": "Technology"},
    {"symbol": "CRM", "name": "Salesforce Inc.", "sector": "Technology"},
    {"symbol": "AMD", "name": "Advanced Micro Devices", "sector": "Technology"},
    {"symbol": "INTC", "name": "Intel Corp.", "sector": "Technology"},
    {"symbol": "QCOM", "name": "Qualcomm Inc.", "sector": "Technology"},
    {"symbol": "ADBE", "name": "Adobe Inc.", "sector": "Technology"},

    # Consumer Discretionary
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "HD", "name": "Home Depot Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "MCD", "name": "McDonald's Corp.", "sector": "Consumer Discretionary"},
    {"symbol": "NKE", "name": "NIKE Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "SBUX", "name": "Starbucks Corp.", "sector": "Consumer Discretionary"},
    {"symbol": "TGT", "name": "Target Corp.", "sector": "Consumer Discretionary"},
    {"symbol": "BKNG", "name": "Booking Holdings Inc.", "sector": "Consumer Discretionary"},

    # Financials
    {"symbol": "BRK.B", "name": "Berkshire Hathaway Class B", "sector": "Financials"},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financials"},
    {"symbol": "V", "name": "Visa Inc.", "sector": "Financials"},
    {"symbol": "MA", "name": "Mastercard Inc.", "sector": "Financials"},
    {"symbol": "GS", "name": "Goldman Sachs Group", "sector": "Financials"},
    {"symbol": "BAC", "name": "Bank of America Corp.", "sector": "Financials"},
    {"symbol": "AXP", "name": "American Express Co.", "sector": "Financials"},
    {"symbol": "BLK", "name": "BlackRock Inc.", "sector": "Financials"},

    # Healthcare
    {"symbol": "LLY", "name": "Eli Lilly and Co.", "sector": "Healthcare"},
    {"symbol": "UNH", "name": "UnitedHealth Group Inc.", "sector": "Healthcare"},
    {"symbol": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare"},
    {"symbol": "ABBV", "name": "AbbVie Inc.", "sector": "Healthcare"},
    {"symbol": "MRK", "name": "Merck & Co.", "sector": "Healthcare"},
    {"symbol": "PFE", "name": "Pfizer Inc.", "sector": "Healthcare"},
    {"symbol": "TMO", "name": "Thermo Fisher Scientific", "sector": "Healthcare"},

    # Energy
    {"symbol": "XOM", "name": "Exxon Mobil Corp.", "sector": "Energy"},
    {"symbol": "CVX", "name": "Chevron Corp.", "sector": "Energy"},
    {"symbol": "COP", "name": "ConocoPhillips", "sector": "Energy"},
    {"symbol": "SLB", "name": "SLB (Schlumberger)", "sector": "Energy"},
    {"symbol": "OXY", "name": "Occidental Petroleum", "sector": "Energy"},

    # Consumer Staples
    {"symbol": "PG", "name": "Procter & Gamble Co.", "sector": "Consumer Staples"},
    {"symbol": "KO", "name": "Coca-Cola Co.", "sector": "Consumer Staples"},
    {"symbol": "PEP", "name": "PepsiCo Inc.", "sector": "Consumer Staples"},
    {"symbol": "COST", "name": "Costco Wholesale Corp.", "sector": "Consumer Staples"},
    {"symbol": "WMT", "name": "Walmart Inc.", "sector": "Consumer Staples"},

    # Industrials
    {"symbol": "CAT", "name": "Caterpillar Inc.", "sector": "Industrials"},
    {"symbol": "BA", "name": "Boeing Co.", "sector": "Industrials"},
    {"symbol": "GE", "name": "GE Aerospace", "sector": "Industrials"},
    {"symbol": "UPS", "name": "United Parcel Service", "sector": "Industrials"},
    {"symbol": "HON", "name": "Honeywell International", "sector": "Industrials"},
    {"symbol": "DE", "name": "Deere & Co.", "sector": "Industrials"},

    # Communication Services
    {"symbol": "NFLX", "name": "Netflix Inc.", "sector": "Communication Services"},
    {"symbol": "DIS", "name": "Walt Disney Co.", "sector": "Communication Services"},
    {"symbol": "T", "name": "AT&T Inc.", "sector": "Communication Services"},
    {"symbol": "VZ", "name": "Verizon Communications", "sector": "Communication Services"},

    # Materials
    {"symbol": "LIN", "name": "Linde plc", "sector": "Materials"},
    {"symbol": "APD", "name": "Air Products & Chemicals", "sector": "Materials"},
    {"symbol": "ECL", "name": "Ecolab Inc.", "sector": "Materials"},
    {"symbol": "NEM", "name": "Newmont Corp.", "sector": "Materials"},

    # Utilities
    {"symbol": "NEE", "name": "NextEra Energy Inc.", "sector": "Utilities"},
    {"symbol": "DUK", "name": "Duke Energy Corp.", "sector": "Utilities"},
    {"symbol": "SO", "name": "Southern Co.", "sector": "Utilities"},

    # Real Estate
    {"symbol": "PLD", "name": "Prologis Inc.", "sector": "Real Estate"},
    {"symbol": "AMT", "name": "American Tower Corp.", "sector": "Real Estate"},
    {"symbol": "EQIX", "name": "Equinix Inc.", "sector": "Real Estate"},

    # Gold / Alternatives (for Ray Dalio All-Weather flavor)
    {"symbol": "GLD", "name": "SPDR Gold Shares ETF", "sector": "Commodities"},
    {"symbol": "TLT", "name": "iShares 20+ Year Treasury ETF", "sector": "Bonds"},
    {"symbol": "IEF", "name": "iShares 7-10 Year Treasury ETF", "sector": "Bonds"},
    {"symbol": "SHY", "name": "iShares 1-3 Year Treasury ETF", "sector": "Bonds"},
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust", "sector": "ETF"},
    {"symbol": "QQQ", "name": "Invesco QQQ Trust", "sector": "ETF"},
]

TICKER_MAP: Dict[str, Dict[str, str]] = {t["symbol"]: t for t in SP500_UNIVERSE}
