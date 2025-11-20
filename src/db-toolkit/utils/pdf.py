"""Beautiful PDF report generation utilities using ReportLab."""

from datetime import datetime
from io import BytesIO
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class PDFReport:
    """Beautiful PDF report generator with consistent styling."""

    def __init__(
        self,
        title: str,
        pagesize=letter,
        author: str = "DB Toolkit",
    ):
        """Initialize PDF report."""
        self.buffer = BytesIO()
        self.doc = SimpleDocTemplate(
            self.buffer,
            pagesize=pagesize,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=1 * inch,
            bottomMargin=0.75 * inch,
        )
        self.title = title
        self.author = author
        self.story = []
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        self.styles.add(
            ParagraphStyle(
                name="CustomTitle",
                parent=self.styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1e40af"),
                spaceAfter=30,
                alignment=1,  # Center
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="SectionHeader",
                parent=self.styles["Heading2"],
                fontSize=16,
                textColor=colors.HexColor("#2563eb"),
                spaceAfter=12,
                spaceBefore=20,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="MetricLabel",
                parent=self.styles["Normal"],
                fontSize=10,
                textColor=colors.HexColor("#6b7280"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="MetricValue",
                parent=self.styles["Normal"],
                fontSize=14,
                textColor=colors.HexColor("#111827"),
                fontName="Helvetica-Bold",
            )
        )

    def add_title(self, subtitle: Optional[str] = None):
        """Add report title and metadata."""
        self.story.append(Paragraph(self.title, self.styles["CustomTitle"]))

        if subtitle:
            self.story.append(Paragraph(subtitle, self.styles["Heading3"]))
            self.story.append(Spacer(1, 12))

        # Metadata
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        meta = f"<font size=9 color='#6b7280'>Generated: {timestamp} | {self.author}</font>"
        self.story.append(Paragraph(meta, self.styles["Normal"]))
        self.story.append(Spacer(1, 20))

    def add_section(self, title: str):
        """Add section header."""
        self.story.append(Paragraph(title, self.styles["SectionHeader"]))
        self.story.append(Spacer(1, 8))

    def add_paragraph(self, text: str, style: str = "Normal"):
        """Add paragraph text."""
        self.story.append(Paragraph(text, self.styles[style]))
        self.story.append(Spacer(1, 8))

    def add_metric_grid(self, metrics: List[Dict[str, Any]], columns: int = 3):
        """Add grid of metrics with labels and values."""
        data = []
        row = []

        for i, metric in enumerate(metrics):
            label = metric.get("label", "")
            value = metric.get("value", "")
            color = metric.get("color", "#111827")

            cell = [
                Paragraph(label, self.styles["MetricLabel"]),
                Paragraph(
                    f"<font color='{color}'><b>{value}</b></font>",
                    self.styles["MetricValue"],
                ),
            ]
            row.append(cell)

            if (i + 1) % columns == 0 or i == len(metrics) - 1:
                data.append([item for sublist in row for item in sublist])
                row = []

        if data:
            col_widths = [1.5 * inch, 1 * inch] * columns
            table = Table(data, colWidths=col_widths)
            table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]
                )
            )
            self.story.append(table)
            self.story.append(Spacer(1, 12))

    def add_table(
        self,
        data: List[List[Any]],
        headers: Optional[List[str]] = None,
        col_widths: Optional[List[float]] = None,
        style: str = "default",
    ):
        """Add formatted table."""
        if not data:
            self.add_paragraph("<i>No data available</i>")
            return

        table_data = []
        if headers:
            table_data.append(headers)
        table_data.extend(data)

        table = Table(table_data, colWidths=col_widths)

        if style == "default":
            table_style = TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 11),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                    ("TOPPADDING", (0, 1), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ]
            )
        elif style == "minimal":
            table_style = TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#d1d5db")),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        else:
            table_style = TableStyle([])

        table.setStyle(table_style)
        self.story.append(table)
        self.story.append(Spacer(1, 12))

    def add_key_value_table(self, items: Dict[str, Any]):
        """Add simple key-value table."""
        data = [[k, str(v)] for k, v in items.items()]
        self.add_table(
            data,
            headers=["Property", "Value"],
            col_widths=[2.5 * inch, 4 * inch],
            style="minimal",
        )

    def add_spacer(self, height: float = 0.2):
        """Add vertical space."""
        self.story.append(Spacer(1, height * inch))

    def add_page_break(self):
        """Add page break."""
        self.story.append(PageBreak())

    def add_divider(self):
        """Add horizontal divider line."""
        line_data = [["" for _ in range(10)]]
        line_table = Table(line_data, colWidths=[0.65 * inch] * 10)
        line_table.setStyle(
            TableStyle(
                [
                    ("LINEABOVE", (0, 0), (-1, 0), 1, colors.HexColor("#e5e7eb")),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        self.story.append(line_table)
        self.story.append(Spacer(1, 12))

    def build(self) -> bytes:
        """Build PDF and return bytes."""
        self.doc.build(self.story)
        pdf_bytes = self.buffer.getvalue()
        self.buffer.close()
        return pdf_bytes


def format_bytes(bytes_value: int) -> str:
    """Format bytes to human readable string."""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def format_duration(seconds: float) -> str:
    """Format duration in seconds to human readable string."""
    if seconds < 1:
        return f"{seconds * 1000:.0f}ms"
    elif seconds < 60:
        return f"{seconds:.2f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"


def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
