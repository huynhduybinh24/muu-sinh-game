import type { JobId } from '../types/job'

export interface JobTutorial {
  title: string
  objective: string
  steps: readonly string[]
}

export const tutorials: Record<JobId, JobTutorial> = {
  it: { title: 'LẬP TRÌNH VIÊN', objective: 'Sửa các lỗi logic đời thường.', steps: ['Chạm dòng sai trên màn hình', 'Chọn cách sửa đúng', 'Nối ĐỌC → KIỂM TRA → HIỂN THỊ', 'Đóng ticket nhanh được thêm tối đa 50 điểm'] },
  accountant: { title: 'KẾ TOÁN', objective: 'Cộng đúng, kiểm tra phiếu và cân sổ.', steps: ['Tính số lượng × đơn giá mỗi dòng', 'Chọn HÓA ĐƠN ĐÚNG hoặc SAI', 'Chọn giao dịch bằng tổng thực tế', 'Đối chiếu nhanh không lỗi nhận 150 điểm'] },
  police: { title: 'CÔNG AN', objective: 'Quản lý ngã tư giả tưởng, chỉ một hướng xanh.', steps: ['Đọc hướng xe chờ và dấu xe ưu tiên', 'ĐỎ CẢ HAI trước khi đổi hướng', 'DỪNG XE VƯỢT ĐỎ nếu có cảnh báo, rồi mở đúng hướng', 'Chỉ mô phỏng hoạt hình, không hướng dẫn thực thi ngoài đời'] },
  doctor: { title: 'BÁC SĨ', objective: 'Chăm sóc vui trong bệnh viện giả tưởng.', steps: ['Chạm người có ký hiệu ưu tiên cao: Đỏ 3 > Vàng 2 > Xanh 1', 'Ghép CHĂN / NƯỚC / ĐỒ CHƠI theo yêu cầu', 'Chạm các ký hiệu theo thứ tự để hoàn thành', 'Không chẩn đoán, kê thuốc hay hướng dẫn điều trị thực tế'] },
  teacher: { title: 'GIÁO VIÊN', objective: 'Một lớp học vui, đáp đúng câu hỏi.', steps: ['Soạn ĐỌC ĐỀ → THẢO LUẬN → TRẢ LỜI', 'Chọn đồ dùng bạn giơ tay yêu cầu', 'Chọn đáp án đúng cho câu hỏi trên bảng', 'CẢ LỚP CHÚ Ý NÀO! giữ mức chú ý để nhận thêm thưởng'] },
  taxi: { title: 'TÀI XẾ', objective: 'Đón và đưa khách tới điểm sáng an toàn.', steps: ['Chạm NHẬN CUỐC rồi dùng bốn nút hướng', 'Tới điểm đón khách, sau đó đi tới điểm đến', 'Chờ đèn giữa màu xanh, tránh xe khác', 'Chuyến nhanh, an toàn giữ khách hài lòng và nhận thêm tối đa 50 điểm'] },
  banhmi: { title: 'BÁN BÁNH MÌ', objective: 'Lắp đúng ổ bánh theo món khách gọi, nhanh tay nhận thêm thưởng.', steps: ["Chạm nguyên liệu đúng món","GIAO KHÁCH để phục vụ","LÀM LẠI nếu chọn sai","Giao nhanh được thêm tối đa 50 điểm"] },
  gas: { title: 'ĐỔ XĂNG', objective: 'Chọn đúng xăng, giữ vòi bơm và thả gần mức khách yêu cầu.', steps: ["Chọn E5 hoặc RON95 theo yêu cầu","Giữ GIỮ ĐỂ BƠM để đổ xăng","Thả khi gần số lít khách gọi","Chọn sai hoặc bơm quá mức bị trừ điểm"] },
  cargo: { title: 'BỐC HÀNG', objective: 'Kéo kiện đúng xe theo ký hiệu, giao liên tiếp để tạo combo.', steps: ["Đọc ký hiệu SÔNG / CHỢ / VƯỜN trên kiện","Giữ và kéo kiện vào xe cùng ký hiệu","Thả bên trong vùng xe để giao hàng","Đúng liên tiếp tạo combo, sai sẽ mất combo"] },
  cleaning: { title: 'QUÉT ĐƯỜNG', objective: 'Kéo chổi gom rác, tránh miệng cống và làm sạch từng đoạn phố.', steps: ["Giữ và kéo chổi qua các mẩu rác","Quét hết rác để hoàn thành đoạn phố","Tránh miệng cống có dấu cảnh báo","Quét sạch không mắc lỗi nhận thêm thưởng"] },
  electrician: { title: 'THỢ ĐIỆN', objective: 'Nối các đầu cùng màu trong bảng mạch giả tưởng để bật sáng đèn.', steps: ["Chạm đầu dây ở bên trái","Chạm đầu cùng màu và tên ở bên phải","Nối tất cả để bật sáng đèn","Đây là trò chơi giả tưởng, không phải hướng dẫn sửa điện"] },
  florist: { title: 'BÁN HOA', objective: 'Kéo hoa đúng vị trí, chọn nơ và gói bó hoa theo mẫu khách yêu cầu.', steps: ["Xem thứ tự ba bông hoa và màu nơ","Giữ hoa bên dưới, kéo vào từng ô bó hoa","Chọn NƠ HỒNG hoặc NƠ VÀNG","BUỘC HOA để chấm điểm; LÀM LẠI nếu cần"] },
  security: { title: 'BẢO VỆ', objective: 'Quan sát bốn ô camera, báo đúng dấu hiệu bất thường của đồ vật.', steps: ["Quan sát cửa kho, vòi nước, thùng hàng và chuông","Chạm tên ô khi đồ vật trong ô có sự cố","Không bấm khi mọi thứ bình thường","Báo nhanh được thêm thưởng; không đánh giá ngoại hình"] },
  photographer: { title: 'CHỤP ẢNH', objective: 'Kéo khung ngắm theo chú chim, giữ yên và bấm máy đúng khoảnh khắc.', steps: ["Kéo khung ngắm theo chú chim","Giữ khung yên một lúc trước khi chụp","Canh vòng sáng và bấm CHỤP ẢNH","Khung chuẩn + đúng khoảnh khắc + ổn định được 150 điểm"] },
  cashier: { title: 'THU NGÂN', objective: 'Quét từng món, cộng tiền và chọn đúng tiền thối cho khách.', steps: ["Chạm QUÉT MÃ cho từng món hàng","Xem tổng tiền và số tiền khách đưa","Chọn đúng số tiền thối lại","Quét thiếu món hoặc thối sai bị trừ điểm"] },
  harvest: { title: 'THU HOẠCH TRÁI CÂY', objective: 'Hái quả vàng chín, tránh quả xanh và ong; đủ năm quả được thưởng giỏ.', steps: ["Chạm quả vàng có dấu ★","Không chọn quả xanh hoặc ong dấu ×","Hái đúng liên tục tạo combo","Mỗi 5 quả chín đầy giỏ thưởng thêm 100 điểm"] },
  rubber: { title: 'CẠO CAO SU', objective: 'Kéo theo đường cong để thu mủ, không cần pixel-perfect.', steps: ['Giữ ở chấm trái trên thân cây', 'Kéo dọc đường sáng tới chấm phải', 'Thả tay để thu mủ và xem độ chuẩn', 'Mỗi cây có 11 giây; cạo nhanh nhận thêm thưởng'] },
  mechanic: { title: 'SỬA XE', objective: 'Đọc triệu chứng và chọn đúng dụng cụ.', steps: ['Lốp xẹp → BƠM LỐP', 'Hết bình → KÍCH BÌNH', 'Xích lỏng → SIẾT XÍCH', 'Bugi bẩn → VỆ SINH BUGI; sửa nhanh để nhận thưởng'] },
  coffee: { title: 'PHA CÀ PHÊ', objective: 'Đúng nguyên liệu, dừng phin trong vùng xanh.', steps: ['Đen: đá; sữa: sữa đặc + đá; bạc xỉu: thêm cả sữa tươi', 'BẮT ĐẦU PHA rồi DỪNG trong vùng xanh', 'Dừng sớm bị nhạt, muộn bị đắng', 'GIAO KHÁCH; dùng LÀM LẠI nếu sai'] },
  fishing: { title: 'ĐÁNH CÁ', objective: 'Chạm khi cá cắn rồi canh nhịp kéo cá.', steps: ['THẢ CÂU và đợi cá cắn', 'CÁ CẮN! → chạm GIẬT CẦN trong 1,3 giây', 'Canh marker vào vùng xanh rồi KÉO CÁ', 'Vùng vàng thưởng chuẩn nhịp; cá hiếm nhiều điểm hơn'] },
  noodle: {
    title: 'BÁN HỦ TIẾU', objective: 'Nấu đúng tô trước khi khách hết kiên nhẫn!',
    steps: ['Xem nguyên liệu khách gọi', 'Chạm để thêm hủ tiếu / nước / thịt / rau', 'LÀM LẠI nếu thêm sai', 'GIAO KHÁCH thật nhanh để nhận thưởng'],
  },
  barber: {
    title: 'CẮT TÓC', objective: 'Cắt theo mẫu, giữ lại các ô tóc màu nâu!',
    steps: ['Nhìn mẫu tóc nhỏ ở trên', 'Ô nâu: giữ tóc; ô nhạt: cắt bỏ', 'Chạm từng mảng tóc để cắt, không cần vẽ', 'Chạm XONG trước khi khách hết kiên nhẫn'],
  },
  carwash: {
    title: 'RỬA XE', objective: 'Chà xe sạch ít nhất 90% để giao khách!',
    steps: ['Giữ và kéo ngón tay / chuột trên vết bẩn', 'Chà từng vùng cho đến khi vết bẩn mờ đi', 'Đạt 90% sẽ tự giao xe', 'Làm nhanh để nhận thêm thưởng'],
  },
  sugarcane: {
    title: 'BÁN NƯỚC MÍA',
    objective: 'Làm đúng món trước khi khách hết kiên nhẫn!',
    steps: [
      'Xem món khách gọi',
      'Thêm đá / tắc',
      'Ép mía',
      'Giao đúng món',
    ],
  },
  construction: {
    title: 'PHỤ HỒ',
    objective: 'Xếp gạch càng chuẩn càng tốt!',
    steps: [
      'Canh viên gạch',
      'Chạm để thả',
      'Xếp càng chuẩn càng nhiều điểm',
      'PERFECT liên tục tạo combo',
    ],
  },
  shipper: {
    title: 'SHIPPER',
    objective: 'Lấy hàng rồi giao thật nhanh!',
    steps: [
      'Di chuyển đến điểm lấy hàng',
      'Lấy hàng trước',
      'Giao đến khách',
      'Né chướng ngại vật',
    ],
  },
}
