from fpdf import FPDF
import os
import re

class StrategicReportPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("helvetica", "B", 8)
            self.set_text_color(60, 180, 200) # Cyan accent
            self.cell(0, 10, "FININTEL STRATEGIC RESEARCH ENGINE", border="B", ln=1, align="L")
            self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()} of {{nb}} | Confidential Research Report", border="T", ln=0, align="C")

def clean_markdown_formatting(text: str) -> str:
    """Strip basic markdown inline tags like ** or * to make text readable in standard PDF."""
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    return text

def draw_vector_chart(pdf: FPDF, history: list[dict], x_offset=15, y_offset=40, width=180, height=42):
    if not history:
        return
        
    prices = [h["close"] for h in history]
    min_p = min(prices)
    max_p = max(prices)
    price_range = max_p - min_p if max_p != min_p else 1.0
    
    # Add padding to top and bottom of range
    min_p = min_p - (price_range * 0.1)
    max_p = max_p + (price_range * 0.1)
    price_range = max_p - min_p
    
    # Draw Background/Border
    pdf.set_draw_color(220, 225, 230)
    pdf.set_fill_color(248, 250, 252)
    pdf.set_line_width(0.3)
    pdf.rect(x_offset, y_offset, width, height, "DF")
    
    # Draw Gridlines (horizontal)
    pdf.set_draw_color(235, 240, 245)
    pdf.set_line_width(0.2)
    grid_lines = 4
    for i in range(1, grid_lines):
        y_pos = y_offset + (height / grid_lines) * i
        pdf.line(x_offset, y_pos, x_offset + width, y_pos)
        
        # Grid price labels
        grid_price = max_p - (price_range / grid_lines) * i
        pdf.set_font("helvetica", "", 7)
        pdf.set_text_color(120, 130, 140)
        pdf.text(x_offset + 2, y_pos - 1, f"{grid_price:.2f}")

    # Plot line
    pdf.set_draw_color(0, 180, 200) # Cyan line
    pdf.set_line_width(0.6)
    
    points_count = len(history)
    x_step = width / (points_count - 1) if points_count > 1 else width
    
    prev_x = None
    prev_y = None
    
    for i, h in enumerate(history):
        curr_price = h["close"]
        curr_x = x_offset + (i * x_step)
        curr_y = y_offset + height - ((curr_price - min_p) / price_range) * height
        
        if prev_x is not None:
            pdf.line(prev_x, prev_y, curr_x, curr_y)
            
        # Draw small marker
        pdf.set_fill_color(0, 180, 200)
        try:
            pdf.circle(curr_x, curr_y, 0.8, "DF")
        except Exception:
            pdf.rect(curr_x - 0.5, curr_y - 0.5, 1, 1, "F")
        
        prev_x = curr_x
        prev_y = curr_y

    # Label Start and End dates
    pdf.set_font("helvetica", "B", 7)
    pdf.set_text_color(100, 110, 120)
    pdf.text(x_offset, y_offset + height + 4, history[0]["date"])
    pdf.text(x_offset + width - 20, y_offset + height + 4, history[-1]["date"])

def render_pdf_table(pdf: FPDF, rows: list[str]):
    if not rows:
        return
        
    valid_rows = []
    for r in rows:
        cells = [clean_markdown_formatting(c.strip()) for c in r.split("|")[1:-1]]
        if all(c.startswith("-") or c == "" for c in cells):
            continue
        valid_rows.append(cells)
        
    if not valid_rows:
        return
        
    pdf.set_font("helvetica", "B", 9)
    col_count = len(valid_rows[0])
    col_width = 190 / col_count
    
    # Draw Headers
    headers = valid_rows[0]
    pdf.set_fill_color(220, 240, 245)
    pdf.set_text_color(10, 50, 80)
    for h in headers:
        pdf.cell(col_width, 8, h, border=1, fill=True, align="C")
    pdf.ln(8)
    
    # Draw Data rows
    pdf.set_font("helvetica", "", 8.5)
    pdf.set_text_color(40, 40, 40)
    alt = False
    for row in valid_rows[1:]:
        if alt:
            pdf.set_fill_color(245, 248, 250)
        else:
            pdf.set_fill_color(255, 255, 255)
            
        padded_row = row + [""] * (col_count - len(row))
        for val in padded_row:
            pdf.cell(col_width, 7, val, border=1, fill=True, align="L")
        pdf.ln(7)
        alt = not alt

def generate_report_pdf(filename: str, query: str, ticker: str | None, markdown_content: str, history: list[dict] = None) -> None:
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    pdf = StrategicReportPDF(orientation="P", unit="mm", format="A4")
    pdf.alias_nb_pages()
    
    # --- PAGE 1: COVER PAGE ---
    pdf.add_page()
    pdf.set_fill_color(12, 20, 35) # Deep slate navy background
    pdf.rect(0, 0, 210, 297, "F")
    
    # Title
    pdf.set_y(80)
    pdf.set_font("helvetica", "B", 24)
    pdf.set_text_color(255, 255, 255)
    pdf.multi_cell(0, 12, "MEGA STRATEGIC\nINVESTMENT REPORT", align="C")
    pdf.ln(10)
    
    # Accent Line
    pdf.set_fill_color(60, 180, 200) # Cyan highlight
    pdf.rect(40, 120, 130, 1.5, "F")
    
    # Metadata
    pdf.set_y(150)
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(60, 180, 200)
    pdf.cell(0, 10, f"TARGET ANALYSED: {ticker or 'MARKET OVERVIEW'}", ln=1, align="C")
    
    from datetime import datetime
    pdf.set_font("helvetica", "", 11)
    pdf.set_text_color(180, 180, 180)
    pdf.multi_cell(0, 8, f"Query: {query}\nGenerated by FinIntel Sovereign Engine\nDate: {datetime.now().strftime('%Y-%m-%d')}", align="C")
    
    # --- PAGE 2: REPORT BODY ---
    pdf.add_page()
    pdf.set_text_color(40, 40, 40)
    
    # Title of stock
    pdf.set_font("helvetica", "B", 16)
    pdf.set_text_color(10, 30, 60)
    pdf.cell(0, 10, f"Strategic Analysis: {ticker or 'Market Summary'}", ln=1)
    pdf.ln(4)
    
    # Draw vector trend chart if history exists
    if history:
        draw_vector_chart(pdf, history, x_offset=15, y_offset=pdf.get_y(), width=180, height=45)
        pdf.set_y(pdf.get_y() + 55) # Shift down to draw sections
    
    # Parse Markdown lines
    lines = markdown_content.split("\n")
    in_table = False
    table_rows = []
    
    for line in lines:
        raw_line = line
        line = line.strip()
        if not line:
            if in_table:
                render_pdf_table(pdf, table_rows)
                table_rows = []
                in_table = False
            pdf.ln(4)
            continue
            
        # Headers
        if line.startswith("# "):
            pdf.set_font("helvetica", "B", 16)
            pdf.set_text_color(10, 30, 60)
            pdf.ln(5)
            pdf.cell(0, 10, clean_markdown_formatting(line[2:]), ln=1)
            pdf.ln(2)
        elif line.startswith("## "):
            pdf.set_font("helvetica", "B", 13)
            pdf.set_text_color(60, 120, 180)
            pdf.ln(4)
            pdf.cell(0, 8, clean_markdown_formatting(line[3:]), ln=1)
            pdf.ln(2)
        elif line.startswith("### "):
            pdf.set_font("helvetica", "B", 11)
            pdf.set_text_color(40, 40, 40)
            pdf.cell(0, 6, clean_markdown_formatting(line[4:]), ln=1)
        # Lists
        elif line.startswith("- ") or line.startswith("* "):
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(60, 60, 60)
            # draw bullet
            pdf.cell(6, 6, chr(149), ln=0)
            pdf.multi_cell(0, 6, clean_markdown_formatting(line[2:]))
        # Tables
        elif line.startswith("|"):
            in_table = True
            table_rows.append(line)
        # Normal Text
        else:
            if in_table:
                render_pdf_table(pdf, table_rows)
                table_rows = []
                in_table = False
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(50, 50, 50)
            pdf.multi_cell(0, 5.5, clean_markdown_formatting(raw_line))
            
    if in_table:
        render_pdf_table(pdf, table_rows)
        
    pdf.output(filename)
