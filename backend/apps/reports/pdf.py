from .services import attach_pdf, generate_report


def generate_pdf_report(report_type, user, title=""):
    return generate_report(report_type=report_type, user=user, title=title)


def attach_pdf_file(report):
    return attach_pdf(report)

