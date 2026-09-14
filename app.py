"""
app.py - Bank Analytics Dashboard
7 file CSV: customers, accounts, branches, cards, employees, loans, loan_payments
"""
import os
import pandas as pd
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

app = Flask(__name__, template_folder="template", static_folder="static")
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))

def load_csv(filename):
    try:
        df = pd.read_csv(os.path.join(BASE, filename))
        print(f"✅ {filename} ({len(df):,} rows)")
        return df
    except FileNotFoundError:
        print(f"⚠️  {filename} not found")
        return pd.DataFrame()

df_customers     = load_csv("customers.csv")
df_accounts      = load_csv("accounts.csv")
df_branches      = load_csv("branches.csv")
df_cards         = load_csv("cards.csv")
df_employees     = load_csv("employees.csv")
df_loans         = load_csv("loans.csv")
df_loan_payments = load_csv("loan_payments.csv")
print("✅ All CSVs loaded")


@app.route("/")
def index():
    return render_template("index.html")


# ── API 1: KPI tổng quan ──
@app.route("/api/overview")
def overview():
    total_loan_amount = round(float(df_loans["loan_amount"].sum()), 2) if not df_loans.empty else 0
    total_balance     = round(float(df_accounts["balance"].sum()), 2) if not df_accounts.empty else 0
    avg_credit        = round(float(df_customers["credit_score"].mean()), 1) if not df_customers.empty else 0
    avg_interest      = round(float(df_loans["interest_rate"].mean()), 2) if not df_loans.empty else 0
    late_payments     = int(df_loan_payments["late_payment_flag"].sum()) if not df_loan_payments.empty else 0
    return jsonify({
        "total_customers":  int(len(df_customers)),
        "total_accounts":   int(len(df_accounts)),
        "total_branches":   int(len(df_branches)),
        "total_employees":  int(len(df_employees)),
        "total_cards":      int(len(df_cards)),
        "total_loans":      int(len(df_loans)),
        "total_balance":    total_balance,
        "total_loan_amount":total_loan_amount,
        "avg_credit_score": avg_credit,
        "avg_interest_rate":avg_interest,
        "late_payments":    late_payments,
    })


# ── API 2: Tài khoản theo loại ──
@app.route("/api/accounts-by-type")
def accounts_by_type():
    result = df_accounts.groupby("account_type").agg(
        count=("account_id","count"), total_balance=("balance","sum")
    ).reset_index().sort_values("count", ascending=False)
    result["total_balance"] = result["total_balance"].round(2)
    return jsonify(result.to_dict(orient="records"))


# ── API 3: Tài khoản theo trạng thái ──
@app.route("/api/accounts-by-status")
def accounts_by_status():
    result = df_accounts.groupby("status").size().reset_index(name="count")
    return jsonify(result.to_dict(orient="records"))


# ── API 4: Khách hàng theo bang ──
@app.route("/api/customers-by-state")
def customers_by_state():
    result = df_customers.groupby("state").size().reset_index(name="total").sort_values("total", ascending=False)
    return jsonify(result.to_dict(orient="records"))


# ── API 5: Khách hàng theo nghề nghiệp ──
@app.route("/api/customers-by-occupation")
def customers_by_occupation():
    result = df_customers.groupby("occupation").size().reset_index(name="count").sort_values("count", ascending=False)
    return jsonify(result.to_dict(orient="records"))


# ── API 6: Phân bố loại thẻ ──
@app.route("/api/cards-by-type")
def cards_by_type():
    result = df_cards.groupby("card_type").size().reset_index(name="count").sort_values("count", ascending=False)
    return jsonify(result.to_dict(orient="records"))


# ── API 7: Thẻ theo trạng thái ──
@app.route("/api/cards-by-status")
def cards_by_status():
    result = df_cards.groupby("status").size().reset_index(name="count")
    return jsonify(result.to_dict(orient="records"))


# ── API 8: Khoản vay theo loại ──
@app.route("/api/loans-by-type")
def loans_by_type():
    result = df_loans.groupby("loan_type").agg(
        count=("loan_id","count"), total_amount=("loan_amount","sum"), avg_rate=("interest_rate","mean")
    ).reset_index().sort_values("count", ascending=False)
    result["total_amount"] = result["total_amount"].round(2)
    result["avg_rate"]     = result["avg_rate"].round(2)
    return jsonify(result.to_dict(orient="records"))


# ── API 9: Khoản vay theo trạng thái ──
@app.route("/api/loans-by-status")
def loans_by_status():
    result = df_loans.groupby("status").agg(
        count=("loan_id","count"), total_amount=("loan_amount","sum")
    ).reset_index()
    result["total_amount"] = result["total_amount"].round(2)
    return jsonify(result.to_dict(orient="records"))


# ── API 10: Nhân viên theo vai trò ──
@app.route("/api/employees-by-role")
def employees_by_role():
    result = df_employees.groupby("role").agg(
        count=("employee_id","count"), avg_salary=("salary","mean")
    ).reset_index().sort_values("count", ascending=False)
    result["avg_salary"] = result["avg_salary"].round(0)
    return jsonify(result.to_dict(orient="records"))


# ── API 11: Top 10 chi nhánh theo số tài khoản ──
@app.route("/api/top-branches")
def top_branches():
    merged = df_accounts.merge(df_branches, on="branch_id", how="left")
    state_col = "state_y" if "state_y" in merged.columns else "state"
    result = merged.groupby(["branch_id","branch_name","city",state_col]).agg(
        account_count=("account_id","count"), total_balance=("balance","sum")
    ).reset_index().rename(columns={state_col:"state"}).sort_values("account_count", ascending=False).head(10)
    result["total_balance"] = result["total_balance"].round(2)
    return jsonify(result.to_dict(orient="records"))


# ── API 12: Loan filter ──
@app.route("/api/loans")
def get_loans():
    if df_loans.empty:
        return jsonify({"success": False, "data": [], "total": 0})
    df = df_loans.copy()
    loan_type = request.args.get("loan_type")
    status    = request.args.get("status")
    if loan_type: df = df[df["loan_type"] == loan_type]
    if status:    df = df[df["status"] == status]
    total    = len(df)
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    df_page  = df.iloc[(page-1)*per_page : page*per_page]
    summary  = {
        "total_count":  total,
        "total_amount": round(float(df["loan_amount"].sum()), 2),
        "avg_amount":   round(float(df["loan_amount"].mean()), 2) if total > 0 else 0,
        "avg_rate":     round(float(df["interest_rate"].mean()), 2) if total > 0 else 0,
    }
    return jsonify({"success": True, "summary": summary, "total": total,
                    "page": page, "per_page": per_page, "data": df_page.to_dict(orient="records")})


# ── API 13: Filter values ──
@app.route("/api/loans/filters")
def loan_filters():
    return jsonify({
        "loan_types": sorted(df_loans["loan_type"].dropna().unique().tolist()),
        "statuses":   sorted(df_loans["status"].dropna().unique().tolist()),
    })


# ── API 14: Phân tích thanh toán vay ──
@app.route("/api/loan-payments-summary")
def loan_payments_summary():
    if df_loan_payments.empty:
        return jsonify([])
    result = df_loan_payments.groupby("late_payment_flag").agg(
        count=("payment_id","count"), total_paid=("amount_paid","sum")
    ).reset_index()
    result["late_payment_flag"] = result["late_payment_flag"].map({0:"Đúng hạn", 1:"Trễ hạn"})
    result["total_paid"] = result["total_paid"].round(2)
    return jsonify(result.to_dict(orient="records"))


# ── Chrome DevTools ──
@app.route("/.well-known/appspecific/com.chrome.devtools.json")
def chrome_devtools():
    return jsonify({}), 200


@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify({"success": False, "error": str(e)}), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Not found"}), 404


if __name__ == "__main__":
    app.run(debug=True, port=5050)
