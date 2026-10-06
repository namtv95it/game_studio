# 📋 KẾ HOẠCH DỰ ÁN REACT WEB APP (GAME_STUDIO)

Dự án phát triển Web App React + Vite tích hợp 2 chức năng tương tác làm video Short/TikTok tỉ lệ 9:16 chuẩn Full HD (1080x1920): **Soi Đèn Pin (Flashlight Reveal)** và **Ghép Bóng (Shadow Match)**.

---

## 🎯 DANH SÁCH MỤC TIÊU & TIẾN ĐỘ

### 🏗️ Giai đoạn 0: Khởi Tạo Dự Án React (Đã Hoàn Thành)
- [x] Tạo dự án React + Vite bằng `create-vite`
- [x] Cài đặt `lucide-react` cho icons giao diện
- [x] Khởi tạo `plan.md` theo dõi tiến độ Web App

---

### 🔦 Giai đoạn 1: Chức Năng 1 - Soi Đèn Pin (Flashlight Reveal) (Đã Hoàn Thành)
- [x] Thiết lập Canvas 2 lớp (Layer 1: Color Image, Layer 2: Black Mask Overlay)
- [x] Xử lý đục thủng `destination-out` theo vị trí con trỏ chuột / bàn tay 👆
- [x] Hỗ trợ 2 kiểu chiếu sáng: Hình tròn (Circle) và Vệt nón chiếu chéo (Cone Beam)
- [x] Sidebar Cài đặt: Radius px, Hand Size px, Scale %, OffsetY px
- [x] Tải lên hình ảnh tùy chỉnh (Upload Custom PNG/JPG)
- [x] Chế độ xem & Quay màn hình chuẩn tỉ lệ 9:16 (1080x1920)

---

### 👻 Giai đoạn 2: Chức Năng 2 - Ghép Bóng (Shadow Match) (Đã Hoàn Thành)
- [x] Tải lên 3 hình ảnh PNG tùy chỉnh
- [x] Tự động chuyển 1 trong 3 ảnh thành Silhouette Bóng Đen đặc màu `#000000`
- [x] Logic Click-to-Pick (Chọn ảnh đi theo bàn tay 👆) và Click-to-Place (Đặt cố định)
- [x] Khung điều chỉnh nét đứt bo tròn kèm 4 núm corner (TL, TR, BL, BR) để resize ảnh
- [x] Phím tắt **Spacebar** reset vị trí 3 ảnh về hàng trên
- [x] Chế độ xem & Quay màn hình chuẩn tỉ lệ 9:16 (1080x1920)

---

## 📌 GHI CHÚ
1. Giao diện luôn luôn hiển thị ở trạng thái sân khấu nằm ngang xoay 90° cùng nền kẻ ô grid chuẩn (40px x 40px) & bàn tay 👆 đồng bộ 100%.
2. Có 2 trạng thái hiển thị:
   - **Trạng thái 1 (Ẩn hết giao diện)**: Phục vụ quay màn hình video 9:16 (Ẩn Header, Sidebar, viền khung shadow). Nhấn `ESC` để thoát.
   - **Trạng thái 2 (Giữ nguyên Sidebar)**: Cho phép tinh chỉnh thông số (Bán kính vệt sáng, kích thước bàn tay 👆, góc chiếu nón, tải ảnh PNG, v.v.).


