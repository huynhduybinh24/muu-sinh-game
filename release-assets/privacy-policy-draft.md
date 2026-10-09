# Chính sách quyền riêng tư — MƯU SINH

Bản nháp chờ duyệt — chưa phải chính sách đã công bố.

Muu Sinh Studio · Rà soát 2026-10-09

## Dữ liệu trên thiết bị

MƯU SINH lưu tên nhân vật do bạn nhập, ngoại hình, đồ sở hữu, tiền và XP trong game, lịch chơi, điểm, thành tựu, nhiệm vụ và tùy chọn âm thanh trên thiết bị. Đây là hồ sơ chơi cục bộ, không phải tài khoản đăng nhập. Không cần cung cấp tên thật. Game không tích hợp đăng nhập, máy chủ lưu game, quảng cáo, mua hàng bằng tiền thật hoặc SDK phân tích hành vi.

## Kết nối và thư viện

Bản Android dùng tài nguyên đóng gói để chơi offline. Mã hiện tại không gửi hồ sơ, điểm hoặc mã định danh thiết bị đến máy chủ của Muu Sinh Studio. Game dùng React, Phaser, Zustand và Capacitor cùng các cầu nối vòng đời ứng dụng, tệp và chia sẻ. Không truy cập danh bạ, vị trí, camera, micro hoặc mã quảng cáo. Bản web tải ứng dụng và bản cập nhật qua nhà cung cấp hosting; hosting và trình duyệt có thể xử lý thông tin kết nối như địa chỉ IP theo chính sách riêng. Android, WebView, hệ điều hành và ứng dụng nhận tệp có thể xử lý dữ liệu theo cài đặt và chính sách của họ.

## Xuất, nhập và chia sẻ tệp

Khi bạn chọn xuất, game tạo ảnh PNG kết quả nghề, điểm và thống kê ca làm, hoặc bản sao JSON chứa tên nhân vật, hồ sơ và tiến trình. PNG hiện không chứa tên nhân vật; JSON có nhiều dữ liệu hơn. Nhập JSON chỉ đọc tệp bạn chọn, kiểm tra định dạng và yêu cầu xác nhận trước khi thay tiến trình. Bạn chọn nơi lưu hoặc ứng dụng nhận tệp qua giao diện hệ thống. Tệp chỉ được chuyển theo thao tác của bạn; ứng dụng nhận, dịch vụ sao lưu hoặc nơi bạn tải lên có thể đưa tệp ra khỏi thiết bị. Chỉ chia sẻ khi hiểu nội dung tệp. Game không yêu cầu quyền truy cập rộng bộ nhớ; bản Android dùng bộ chọn tệp và cache riêng. Cache xuất quá 24 giờ được dọn khi tạo lượt xuất mới, không phải tự xóa đúng sau 24 giờ.

## Lưu giữ, xóa và sao lưu

Tiến trình được lưu cục bộ để tiếp tục chơi và phục hồi khi lỗi. Đặt lại trong mục Dữ liệu lưu thay tiến trình đang dùng nhưng giữ một bản recovery cục bộ của dữ liệu trước đó; nhập backup và chuyển phiên bản save cũng có thể tạo bản recovery. Bản này được thay ở lần tạo recovery tiếp theo, không có thời hạn tự xóa. Muốn xóa cả tiến trình và recovery, hãy xóa dữ liệu ứng dụng trong cài đặt Android hoặc dữ liệu trang web trong trình duyệt. Bản sao bạn đã lưu hoặc gửi đi phải được xóa riêng tại nơi nhận. Cache có thể được hệ điều hành dọn. Manifest Android hiện cho phép sao lưu hệ thống; việc sao lưu/khôi phục phụ thuộc thiết bị và cài đặt Android, không phải cloud save của Muu Sinh Studio. Gỡ ứng dụng không bảo đảm xóa bản sao hệ thống hoặc tệp đã xuất. Hãy dùng JSON để sao lưu chủ động. Dữ liệu web và Android nằm ở môi trường riêng, không tự chuyển sang nhau.

## An toàn và lựa chọn của bạn

Dữ liệu chơi nằm trong vùng lưu trữ của trình duyệt hoặc ứng dụng và không được game mã hóa riêng. Hãy bảo vệ thiết bị và các tệp sao lưu; không gửi JSON có thông tin bạn không muốn công khai. Nếu bạn dùng nút sao chép backup, nội dung được đưa vào clipboard; lịch sử clipboard hoặc ứng dụng khác có thể truy cập theo cài đặt hệ điều hành. Bạn có thể chơi offline, không dùng chia sẻ, nhập bản sao bạn tin cậy hoặc đặt lại dữ liệu sau khi sao lưu. Không có tài khoản máy chủ để yêu cầu xóa. Chính sách sẽ cần được rà soát lại nếu game bổ sung SDK hoặc tính năng xử lý dữ liệu khác.

## Liên hệ và tình trạng duyệt

Nhà phát triển: Muu Sinh Studio. Email liên hệ chưa được cung cấp; URL chính sách công khai chưa được duyệt. Hai mục này phải được chủ dự án bổ sung và nội dung phải được duyệt trước khi phát hành Google Play. Bản nháp này không tự công bố chính sách hoặc thay thế việc khai báo Data Safety và rà soát nghĩa vụ pháp lý của nhà phát triển.

Không công bố trước khi chủ dự án duyệt và bổ sung email/URL thật.
