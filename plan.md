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
- [x] Sidebar Cài đặt: Radius px, Hand Size px, Scale %, OffsetY px (Hỗ trợ kéo thanh trượt + Nhập tay ô số)
- [x] Tải lên hình ảnh nhân vật tùy chỉnh (Upload Custom PNG)
- [x] Chế độ xem & Quay màn hình chuẩn tỉ lệ 9:16 (1080x1920)

---

### 👻 Giai đoạn 2: Chức Năng 2 - Ghép Bóng (Shadow Match) (Đã Hoàn Thành)
- [x] Tải lên 3 hình ảnh PNG tùy chỉnh
- [x] Tự động chuyển 1 trong 3 ảnh thành Silhouette Bóng Đen đặc màu `#000000`
- [x] Logic Click-to-Pick (Chọn ảnh đi theo bàn tay 👆) và Click-to-Place (Đặt khít cố định lên bóng đen, giao diện sạch không khung viền)
- [x] Phím tắt **Spacebar** reset vị trí kèm hiệu ứng lướt bay mượt mà (Spring-back animation) thu nhỏ trở về đúng khe thẻ bài ban đầu
- [x] Chế độ xem & Quay màn hình chuẩn tỉ lệ 9:16 (1080x1920)

---

### 🎡 Giai đoạn 3: Chức Năng 3 - Vòng Quay Cửa Bí Mật (Lucky Wheel Doors) (Đã Hoàn Thành)
- [x] Màn hình Cài đặt (Setup Screen): Tải ảnh 3 Nhân vật & 3 Phần thưởng/Quái vật/Hố đen (`URL.createObjectURL`)
- [x] Cài đặt kịch bản 3 lượt (Mapping Character -> Door Color -> Result Action)
- [x] Màn hình Trò chơi (Gameplay Screen): Vòng quay 3 màu sắc, 3 cánh cửa bằng gỗ, Nhân vật tiến lên từng lượt
- [x] Animation Kết quả tương tác:
  - 👹 **Quái vật (Bị cào K.O)**: Slash mark 0.2s + xoay ngang ngã K.O
  - 🌀 **Hố đen (Bị hút)**: Transform scale(0) rotate(1080deg) hút vào tâm cửa
  - 🎁 **Quà thưởng (Chiến thắng)**: Mưa trái tim rơi + Nhân vật nhảy múa vui mừng (`animate-bounce`)
- [x] Tính năng **Cài đặt Vị trí (X, Y) & Kích thước**: Tùy chỉnh linh hoạt Kích thước, Vị trí X/Y riêng biệt cho Vòng quay, Bộ cửa, và Nhân vật
- [x] Tính năng **Ảnh Hợp thể / Kết đôi khai mở**: Khi nhận Quà thưởng ➔ Tự động ẩn quà trong cửa và hiển thị trực tiếp ảnh nhận quà (`coupleImg`) thay thế vị trí nhân vật với mưa trái tim & icon ăn mừng lấp lánh
- [x] Tính năng **Tự động hóa hoàn toàn**: Nhấn "Bắt đầu Gameplay" ➔ Tự động ẩn giao diện vào chế độ quay video 9:16 + Tự động thực hiện liên tục từ Lượt 1 đến Lượt 3
- [x] Chế độ xem & Quay màn hình chuẩn tỉ lệ 9:16 (1080x1920) (Nhấn `ESC` để thoát)

---

### 🪄 Giai đoạn 4: Chức Năng 4 - Trộn Ảnh Blend & Blend+ (Vortex Pixel Fusion) (Đã Hoàn Thành)
- [x] Phân tích & chuyển đổi thuật toán xoáy Pixel Vortex Canvas (`fxFusion`) từ `D:\Git\captain-game\image-blend\blend.js`
- [x] **Chế độ Blend (Đơn)**: 
  - Tải ảnh Nhân vật gốc + tối đa 4 bước (Emoji + Kết quả)
  - Hiệu ứng Emoji bay vào va chạm sinh quầng sáng (`flashOut`) + hạt xoáy dung hợp Pixel Vortex + Emoji xoay Hút (`fusionAbsorb`)
  - Tùy chọn hiệu ứng xuất hiện (Eraser Stroke Up, Eraser Up, Vortex Spiral, Diamond Grid, Split Curtain, Classic, None)
  - Màn hình tổng kết 4 ô kết quả kèm câu hỏi tùy chỉnh & badge hiệu ứng
- [x] **Chế độ Blend+ (Chuỗi Lượt / Batch Stream Pairs)**:
  - Bảng quản lý danh sách luồng Blend+ (Nhân vật + Emoji + Kết quả)
  - Tùy chỉnh Thời gian chờ Emoji bay (`bpCharWaitSec`) và Thời gian dừng kết quả (`bpPauseSec`)
  - Highlight dòng luồng đang phát (`active-blend` / `done-blend`)
  - Tự động chạy tuần tự từng luồng trong danh sách
- [x] Chế độ Khởi chạy 9:16 Full HD (1080x1920) và đồng bộ Web Audio SFX

---

## 📌 GHI CHÚ
1. Giao diện luôn luôn hiển thị ở trạng thái sân khấu nằm ngang xoay 90° cùng nền kẻ ô grid chuẩn (40px x 40px) & bàn tay 👆 đồng bộ 100%.
2. Có 2 trạng thái hiển thị:
   - **Trạng thái 1 (Ẩn hết giao diện)**: Phục vụ quay màn hình video 9:16 (Ẩn Header, Sidebar, viền khung shadow). Nhấn `ESC` để thoát.
   - **Trạng thái 2 (Giữ nguyên Sidebar)**: Cho phép tinh chỉnh thông số (Bán kính vệt sáng, kích thước bàn tay 👆, góc chiếu nón, tải ảnh PNG, v.v.).


