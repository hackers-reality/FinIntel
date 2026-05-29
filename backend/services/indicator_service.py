import math
from typing import Any

def calculate_sma(prices: list[float], period: int) -> list[float]:
    sma = []
    for i in range(len(prices)):
        if i < period - 1:
            sma.append(float('nan'))
        else:
            sma.append(sum(prices[i - period + 1 : i + 1]) / period)
    return sma

def calculate_ema(prices: list[float], period: int) -> list[float]:
    if not prices:
        return []
    ema = []
    multiplier = 2 / (period + 1)
    
    # First value is SMA
    first_valid = period - 1
    if len(prices) < period:
        return [float('nan')] * len(prices)
        
    for i in range(len(prices)):
        if i < first_valid:
            ema.append(float('nan'))
        elif i == first_valid:
            sma_val = sum(prices[:period]) / period
            ema.append(sma_val)
        else:
            ema.append((prices[i] - ema[-1]) * multiplier + ema[-1])
    return ema

def calculate_rsi(prices: list[float], period: int = 14) -> list[float]:
    if len(prices) < period + 1:
        return [float('nan')] * len(prices)
        
    rsi = [float('nan')] * len(prices)
    gains = []
    losses = []
    
    for i in range(1, len(prices)):
        diff = prices[i] - prices[i - 1]
        gains.append(max(diff, 0.0))
        losses.append(max(-diff, 0.0))
        
    # First average gain/loss
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    if avg_loss == 0:
        rsi[period] = 100.0
    else:
        rs = avg_gain / avg_loss
        rsi[period] = 100.0 - (100.0 / (1.0 + rs))
        
    for i in range(period + 1, len(prices)):
        idx = i - 1
        avg_gain = (avg_gain * (period - 1) + gains[idx]) / period
        avg_loss = (avg_loss * (period - 1) + losses[idx]) / period
        
        if avg_loss == 0:
            rsi[i] = 100.0
        else:
            rs = avg_gain / avg_loss
            rsi[i] = 100.0 - (100.0 / (1.0 + rs))
            
    return rsi

def calculate_macd(prices: list[float]) -> dict[str, list[float]]:
    ema12 = calculate_ema(prices, 12)
    ema26 = calculate_ema(prices, 26)
    
    macd_line = []
    for e12, e26 in zip(ema12, ema26):
        if math.isnan(e12) or math.isnan(e26):
            macd_line.append(float('nan'))
        else:
            macd_line.append(e12 - e26)
            
    # Filter out NaNs from start to calculate signal line (EMA 9 of MACD)
    signal_input = [x for x in macd_line if not math.isnan(x)]
    signal_raw = calculate_ema(signal_input, 9)
    
    # Pad signal line with NaNs to align with original prices array length
    nan_count = len(prices) - len(signal_raw)
    signal_line = [float('nan')] * nan_count + signal_raw
    
    histogram = []
    for m, s in zip(macd_line, signal_line):
        if math.isnan(m) or math.isnan(s):
            histogram.append(float('nan'))
        else:
            histogram.append(m - s)
            
    return {"macd": macd_line, "signal": signal_line, "hist": histogram}

def calculate_atr(highs: list[float], lows: list[float], closes: list[float], period: int = 14) -> list[float]:
    if len(closes) < period + 1:
        return [float('nan')] * len(closes)
        
    tr = [0.0] * len(closes)
    tr[0] = highs[0] - lows[0]
    
    for i in range(1, len(closes)):
        h = highs[i]
        l = lows[i]
        pc = closes[i - 1]
        tr[i] = max(h - l, abs(h - pc), abs(l - pc))
        
    atr = [float('nan')] * len(closes)
    # First ATR is SMA of True Ranges
    atr[period - 1] = sum(tr[:period]) / period
    
    for i in range(period, len(closes)):
        atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period
        
    return atr

def calculate_bollinger_bands(prices: list[float], period: int = 20, num_std: float = 2.0) -> dict[str, list[float]]:
    if len(prices) < period:
        nans = [float('nan')] * len(prices)
        return {"upper": nans, "middle": nans, "lower": nans}
        
    middle = calculate_sma(prices, period)
    upper = []
    lower = []
    
    for i in range(len(prices)):
        if i < period - 1:
            upper.append(float('nan'))
            lower.append(float('nan'))
        else:
            window = prices[i - period + 1 : i + 1]
            mean = middle[i]
            variance = sum((x - mean) ** 2 for x in window) / period
            std_dev = math.sqrt(variance)
            upper.append(mean + num_std * std_dev)
            lower.append(mean - num_std * std_dev)
            
    return {"upper": upper, "middle": middle, "lower": lower}

def get_gainzalgo_v3_signals(highs: list[float], lows: list[float], closes: list[float]) -> dict[str, Any]:
    if len(closes) < 30:
        return {
            "signal": "HOLD",
            "score": 0,
            "rsi": 50.0,
            "stop_loss": 0.0,
            "take_profit": 0.0,
            "details": "Insufficient historical data points to generate quantitative signal (minimum 30 required)."
        }
        
    ema9 = calculate_ema(closes, 9)
    ema21 = calculate_ema(closes, 21)
    rsi = calculate_rsi(closes, 14)
    macd_data = calculate_macd(closes)
    bb = calculate_bollinger_bands(closes, 20)
    atr = calculate_atr(highs, lows, closes, 14)
    
    # Latest values
    price = closes[-1]
    curr_ema9 = ema9[-1]
    curr_ema21 = ema21[-1]
    curr_rsi = rsi[-1]
    curr_macd = macd_data["macd"][-1]
    curr_signal = macd_data["signal"][-1]
    curr_upper = bb["upper"][-1]
    curr_lower = bb["lower"][-1]
    curr_atr = atr[-1] if not math.isnan(atr[-1]) else (price * 0.02)
    
    score = 0
    reasons = []
    
    # 1. EMA Trend Crossover
    if curr_ema9 > curr_ema21 and price > curr_ema21:
        score += 1
        reasons.append("EMA Golden Cross (Bullish Trend)")
    elif curr_ema9 < curr_ema21 and price < curr_ema21:
        score -= 1
        reasons.append("EMA Death Cross (Bearish Trend)")
        
    # 2. RSI Overbought / Oversold
    if curr_rsi < 35:
        score += 1
        reasons.append(f"RSI oversold indicators: {curr_rsi:.1f} (reversal target)")
    elif curr_rsi > 65:
        score -= 1
        reasons.append(f"RSI overbought indicators: {curr_rsi:.1f} (overextended target)")
        
    # 3. MACD Momentum
    if curr_macd > curr_signal:
        score += 1
        reasons.append("MACD above Signal Line (Bullish Momentum)")
    elif curr_macd < curr_signal:
        score -= 1
        reasons.append("MACD below Signal Line (Bearish Momentum)")
        
    # 4. Bollinger Bands Reversal
    if price <= curr_lower:
        score += 1
        reasons.append("Price touching/exceeding Lower Bollinger Band")
    elif price >= curr_upper:
        score -= 1
        reasons.append("Price touching/exceeding Upper Bollinger Band")
        
    # Composite Action Signal
    if score >= 3:
        signal = "STRONG BUY"
    elif score >= 1:
        signal = "BUY"
    elif score <= -3:
        signal = "STRONG SELL"
    elif score <= -1:
        signal = "SELL"
    else:
        signal = "HOLD"
        
    # SL/TP Targets using Average True Range (ATR)
    if "BUY" in signal:
        stop_loss = price - (curr_atr * 1.5)
        take_profit = price + (curr_atr * 3.0)
    elif "SELL" in signal:
        stop_loss = price + (curr_atr * 1.5)
        take_profit = price - (curr_atr * 3.0)
    else:
        stop_loss = price - (curr_atr * 2.0)
        take_profit = price + (curr_atr * 2.0)
        
    return {
        "signal": signal,
        "score": score,
        "rsi": round(curr_rsi, 2) if not math.isnan(curr_rsi) else 50.0,
        "macd": round(curr_macd, 4) if not math.isnan(curr_macd) else 0.0,
        "ema9": round(curr_ema9, 2) if not math.isnan(curr_ema9) else price,
        "ema21": round(curr_ema21, 2) if not math.isnan(curr_ema21) else price,
        "stop_loss": round(stop_loss, 2),
        "take_profit": round(take_profit, 2),
        "details": "; ".join(reasons) if reasons else "Indicators neutral. Consolidation mode."
    }
