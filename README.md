# Bank Analytics Dashboard

Ứng dụng web phân tích dữ liệu ngân hàng toàn diện, xây dựng bằng Flask + Chart.js, đọc dữ liệu từ 7 file CSV.

---

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| Python / Flask | Backend API server |
| Flask-CORS | Xử lý cross-origin request |
| Pandas | Đọc và xử lý dữ liệu CSV |
| HTML5 / CSS3 | Giao diện frontend |
| JavaScript ES6 | Logic gọi API, xử lý sự kiện |
| Chart.js 4 | Vẽ biểu đồ (CDN) |
| Font Awesome 6 | Icon (CDN) |
| Google Fonts (Poppins) | Font chữ (CDN) |

---

## Cách chạy

> Yêu cầu: Python 3.8+, pip, kết nối Internet (để tải CDN)

**Bước 1: Clone repo**
```bash
git clone https://github.com/Dandy3979/bank-analytics-dashboard.git
cd bank-analytics-dashboard
```

**Bước 2: Cài thư viện**
```bash
pip install -r requirement.txt
```

**Bước 3: Chạy Flask server**
```bash
python app.py
```

**Bước 4: Mở trình duyệt**
```
http://127.0.0.1:5050
```

> Terminal phải giữ nguyên đang chạy. Đóng terminal thì server tắt.

---

## Cấu trúc thư mục

```
bank-analytics-dashboard/
│
├── app.py                  # Flask API server (14 endpoints)
├── README.md               # Tài liệu dự án
├── requirement.txt         # Thư viện cần cài
├── .gitignore
│
├── data/                   # Dữ liệu CSV
│   ├── accounts.csv
│   ├── branches.csv
│   ├── cards.csv
│   ├── customers.csv
│   ├── employees.csv
│   ├── loans.csv
│   └── loan_payments.csv
│
├── template/
│   └── index.html          # Giao diện dashboard
│
└── static/
    ├── style.css           # CSS: layout, card, responsive
    └── script.js           # JavaScript: gọi API, vẽ Chart.js
```

---

## Nguồn dữ liệu (7 file CSV)

| File | Mô tả | Số dòng |
|---|---|---|
| `accounts.csv` | Thông tin tài khoản ngân hàng | ~95,000 |
| `branches.csv` | Danh sách chi nhánh | ~150 |
| `customers.csv` | Thông tin khách hàng | ~60,000 |
| `cards.csv` | Thẻ tín dụng / ghi nợ | ~65,000 |
| `employees.csv` | Thông tin nhân viên | ~1,800 |
| `loans.csv` | Khoản vay | ~22,000 |
| `loan_payments.csv` | Lịch sử thanh toán vay | ~600,000 |

---

## API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/` | Giao diện dashboard |
| GET | `/api/overview` | KPI tổng quan |
| GET | `/api/accounts-by-type` | Tài khoản theo loại |
| GET | `/api/accounts-by-status` | Tài khoản theo trạng thái |
| GET | `/api/customers-by-state` | Khách hàng theo bang |
| GET | `/api/customers-by-occupation` | Khách hàng theo nghề nghiệp |
| GET | `/api/cards-by-type` | Phân bố loại thẻ |
| GET | `/api/cards-by-status` | Thẻ theo trạng thái |
| GET | `/api/loans-by-type` | Khoản vay theo loại |
| GET | `/api/loans-by-status` | Khoản vay theo trạng thái |
| GET | `/api/employees-by-role` | Nhân viên theo vai trò |
| GET | `/api/top-branches` | Top 10 chi nhánh |
| GET | `/api/loans` | Danh sách vay có filter + phân trang |
| GET | `/api/loans/filters` | Giá trị filter hợp lệ |
| GET | `/api/loan-payments-summary` | Thống kê thanh toán đúng/trễ hạn |

---

## Tính năng dashboard

- **11 KPI cards** — Khách hàng, tài khoản, khoản vay, thẻ, nhân viên, chi nhánh, tổng số dư, tổng dư nợ, credit score, lãi suất TB, trả trễ hạn
- **Tài khoản** — Doughnut theo loại + trạng thái
- **Khách hàng** — Bar ngang nghề nghiệp + Bar đứng theo bang có bộ lọc
- **Thẻ** — Doughnut loại thẻ + trạng thái
- **Nhân viên** — Bar ngang theo vai trò
- **Khoản vay** — Doughnut loại vay + trạng thái + thanh toán đúng/trễ hạn
- **Bảng lọc khoản vay** — Filter theo loại + trạng thái, phân trang, xuất CSV
- **Top 10 chi nhánh** — Biểu đồ bar + bảng, xuất ảnh PNG
- **Responsive** — Hiển thị tốt trên Desktop, Tablet, Mobile

---

## Public qua ngrok

Để chia sẻ dashboard với người khác mà không cần deploy:

**Terminal 1** — chạy Flask:
```bash
python app.py
```

**Terminal 2** — chạy ngrok:
```bash
ngrok http 5050
```

Copy link `https://xxxx.ngrok-free.app` gửi cho người khác.

---

## Màu sắc chủ đạo

| Ý nghĩa | Màu | Hex |
|---|---|---|
| Primary | Xanh navy | `#0f4c81` |
| Success | Xanh lá | `#2e7d32` |
| Warning | Cam | `#e65100` |
| Danger | Đỏ | `#c62828` |
| Info | Tím | `#6a1b9a` |
