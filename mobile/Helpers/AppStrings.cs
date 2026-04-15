namespace AudioGo.Helpers;

/// <summary>
/// Static dictionary-based i18n for all UI text.
/// Supports 7 languages: vi, en, ja, ko, zh-Hans, fr, th.
/// POI content (title, description, audio) comes from the API — this is only for static UI text.
/// </summary>
public static class AppStrings
{
    private static readonly Dictionary<string, Dictionary<string, string>> _strings = new()
    {
        // ═══════════════════════════════════════════════════════════════
        // Tab Bar
        // ═══════════════════════════════════════════════════════════════
        ["tab_home"] = new()
        {
            ["vi"] = "Trang chủ", ["en"] = "Home", ["ja"] = "ホーム",
            ["ko"] = "홈", ["zh-Hans"] = "首页", ["fr"] = "Accueil", ["th"] = "หน้าแรก"
        },
        ["tab_map"] = new()
        {
            ["vi"] = "Bản đồ", ["en"] = "Map", ["ja"] = "地図",
            ["ko"] = "지도", ["zh-Hans"] = "地图", ["fr"] = "Carte", ["th"] = "แผนที่"
        },
        ["tab_search"] = new()
        {
            ["vi"] = "Khám phá", ["en"] = "Explore", ["ja"] = "探索",
            ["ko"] = "탐색", ["zh-Hans"] = "探索", ["fr"] = "Explorer", ["th"] = "สำรวจ"
        },
        ["tab_settings"] = new()
        {
            ["vi"] = "Cài đặt", ["en"] = "Settings", ["ja"] = "設定",
            ["ko"] = "설정", ["zh-Hans"] = "设置", ["fr"] = "Paramètres", ["th"] = "ตั้งค่า"
        },

        // ═══════════════════════════════════════════════════════════════
        // MainPage — Hero & Header
        // ═══════════════════════════════════════════════════════════════
        ["main_area_name"] = new()
        {
            ["vi"] = "Khu phố Vĩnh Khánh", ["en"] = "Vinh Khanh Street", ["ja"] = "ヴィンカイン通り",
            ["ko"] = "빈카인 거리", ["zh-Hans"] = "永庆街区", ["fr"] = "Rue Vinh Khanh", ["th"] = "ถนนวิญคานห์"
        },
        ["main_area_sub"] = new()
        {
            ["vi"] = "Quận 4, TP. Hồ Chí Minh", ["en"] = "District 4, Ho Chi Minh City", ["ja"] = "4区、ホーチミン市",
            ["ko"] = "4군, 호치민시", ["zh-Hans"] = "胡志明市第四郡", ["fr"] = "District 4, Hô-Chi-Minh-Ville", ["th"] = "เขต 4, นครโฮจิมินห์"
        },
        ["main_hero_discover"] = new()
        {
            ["vi"] = "🎧 Bắt đầu khám phá", ["en"] = "🎧 Start exploring", ["ja"] = "🎧 探索を始める",
            ["ko"] = "🎧 탐험 시작", ["zh-Hans"] = "🎧 开始探索", ["fr"] = "🎧 Commencer l'exploration", ["th"] = "🎧 เริ่มสำรวจ"
        },
        ["main_hero_food_street"] = new()
        {
            ["vi"] = "Phố Ẩm Thực", ["en"] = "Food Street", ["ja"] = "グルメストリート",
            ["ko"] = "먹자골목", ["zh-Hans"] = "美食街", ["fr"] = "Rue Gastronomique", ["th"] = "ถนนอาหาร"
        },
        ["main_hero_vinh_khanh"] = new()
        {
            ["vi"] = "Vĩnh Khánh", ["en"] = "Vinh Khanh", ["ja"] = "ヴィンカイン",
            ["ko"] = "빈카인", ["zh-Hans"] = "永庆", ["fr"] = "Vinh Khanh", ["th"] = "วิญคานห์"
        },

        // ═══════════════════════════════════════════════════════════════
        // MainPage — Nearby Section
        // ═══════════════════════════════════════════════════════════════
        ["nearby_title"] = new()
        {
            ["vi"] = "Điểm nổi bật gần bạn", ["en"] = "Highlights nearby", ["ja"] = "近くの注目スポット",
            ["ko"] = "주변 명소", ["zh-Hans"] = "附近亮点", ["fr"] = "Points d'intérêt à proximité", ["th"] = "จุดเด่นใกล้คุณ"
        },
        ["nearby_view_all"] = new()
        {
            ["vi"] = "Xem tất cả →", ["en"] = "View all →", ["ja"] = "すべて見る →",
            ["ko"] = "모두 보기 →", ["zh-Hans"] = "查看全部 →", ["fr"] = "Voir tout →", ["th"] = "ดูทั้งหมด →"
        },
        ["nearby_empty_title"] = new()
        {
            ["vi"] = "Chưa tìm thấy điểm gần bạn", ["en"] = "No nearby spots found", ["ja"] = "近くにスポットが見つかりません",
            ["ko"] = "주변에 장소가 없습니다", ["zh-Hans"] = "未找到附近地点", ["fr"] = "Aucun lieu à proximité", ["th"] = "ไม่พบสถานที่ใกล้เคียง"
        },
        ["nearby_empty_desc"] = new()
        {
            ["vi"] = "Đi dạo quanh phố Vĩnh Khánh để nghe thuyết minh tự động",
            ["en"] = "Walk around Vinh Khanh Street for automatic audio guides",
            ["ja"] = "ヴィンカイン通りを歩いて自動音声ガイドを聞きましょう",
            ["ko"] = "빈카인 거리를 걸으며 자동 오디오 가이드를 들어보세요",
            ["zh-Hans"] = "在永庆街漫步，收听自动语音导览",
            ["fr"] = "Promenez-vous dans la rue Vinh Khanh pour écouter les guides audio automatiques",
            ["th"] = "เดินเล่นรอบถนนวิญคานห์เพื่อฟังไกด์เสียงอัตโนมัติ"
        },

        // ═══════════════════════════════════════════════════════════════
        // MainPage — Status & Mini player
        // ═══════════════════════════════════════════════════════════════
        ["status_loading"] = new()
        {
            ["vi"] = "Đang tải dữ liệu...", ["en"] = "Loading data...", ["ja"] = "データを読み込み中...",
            ["ko"] = "데이터 로드 중...", ["zh-Hans"] = "正在加载数据...", ["fr"] = "Chargement des données...", ["th"] = "กำลังโหลดข้อมูล..."
        },
        ["status_tracking"] = new()
        {
            ["vi"] = "Đang theo dõi {0} điểm", ["en"] = "Tracking {0} spots", ["ja"] = "{0}スポットを追跡中",
            ["ko"] = "{0}개 장소 추적 중", ["zh-Hans"] = "正在追踪{0}个地点", ["fr"] = "Suivi de {0} points", ["th"] = "กำลังติดตาม {0} จุด"
        },
        ["status_gps"] = new()
        {
            ["vi"] = "Chờ GPS...", ["en"] = "Waiting for GPS...", ["ja"] = "GPSを待っています...",
            ["ko"] = "GPS 대기 중...", ["zh-Hans"] = "等待GPS...", ["fr"] = "En attente du GPS...", ["th"] = "รอ GPS..."
        },
        ["status_auto_playing"] = new()
        {
            ["vi"] = "Đang tự động phát: {0}", ["en"] = "Auto-playing: {0}", ["ja"] = "自動再生中: {0}",
            ["ko"] = "자동 재생 중: {0}", ["zh-Hans"] = "自动播放: {0}", ["fr"] = "Lecture automatique : {0}", ["th"] = "เล่นอัตโนมัติ: {0}"
        },
        ["mini_playing"] = new()
        {
            ["vi"] = "Đang phát", ["en"] = "Now playing", ["ja"] = "再生中",
            ["ko"] = "재생 중", ["zh-Hans"] = "正在播放", ["fr"] = "En lecture", ["th"] = "กำลังเล่น"
        },

        // ═══════════════════════════════════════════════════════════════
        // SearchPage
        // ═══════════════════════════════════════════════════════════════
        ["search_title"] = new()
        {
            ["vi"] = "Khám phá", ["en"] = "Explore", ["ja"] = "探索",
            ["ko"] = "탐색", ["zh-Hans"] = "探索", ["fr"] = "Explorer", ["th"] = "สำรวจ"
        },
        ["search_area_sub"] = new()
        {
            ["vi"] = "Vĩnh Khánh · Quận 4", ["en"] = "Vinh Khanh · District 4", ["ja"] = "ヴィンカイン・4区",
            ["ko"] = "빈카인 · 4군", ["zh-Hans"] = "永庆 · 第四郡", ["fr"] = "Vinh Khanh · District 4", ["th"] = "วิญคานห์ · เขต 4"
        },
        ["search_placeholder"] = new()
        {
            ["vi"] = "Tìm kiếm địa điểm, ẩm thực...", ["en"] = "Search places, food...", ["ja"] = "場所、グルメを検索...",
            ["ko"] = "장소, 음식 검색...", ["zh-Hans"] = "搜索地点、美食...", ["fr"] = "Rechercher des lieux, cuisine...", ["th"] = "ค้นหาสถานที่, อาหาร..."
        },
        ["search_welcome_title"] = new()
        {
            ["vi"] = "Khám phá Phố Vĩnh Khánh", ["en"] = "Explore Vinh Khanh Street", ["ja"] = "ヴィンカイン通りを探索",
            ["ko"] = "빈카인 거리 탐험", ["zh-Hans"] = "探索永庆街", ["fr"] = "Explorez la rue Vinh Khanh", ["th"] = "สำรวจถนนวิญคานห์"
        },
        ["search_welcome_subtitle"] = new()
        {
            ["vi"] = "Gõ tên địa điểm hoặc chọn danh mục bên trên",
            ["en"] = "Type a place name or select a category above",
            ["ja"] = "場所名を入力するか、上のカテゴリーを選択してください",
            ["ko"] = "장소명을 입력하거나 위의 카테고리를 선택하세요",
            ["zh-Hans"] = "输入地点名称或选择上方类别",
            ["fr"] = "Tapez un nom de lieu ou sélectionnez une catégorie ci-dessus",
            ["th"] = "พิมพ์ชื่อสถานที่หรือเลือกหมวดหมู่ด้านบน"
        },
        ["search_empty_title"] = new()
        {
            ["vi"] = "Không tìm thấy kết quả", ["en"] = "No results found", ["ja"] = "結果が見つかりません",
            ["ko"] = "결과를 찾을 수 없습니다", ["zh-Hans"] = "未找到结果", ["fr"] = "Aucun résultat trouvé", ["th"] = "ไม่พบผลลัพธ์"
        },
        ["search_empty_subtitle"] = new()
        {
            ["vi"] = "Thử tìm \"bún bò\", \"cà phê\", \"di tích\"...",
            ["en"] = "Try searching \"pho\", \"coffee\", \"temple\"...",
            ["ja"] = "「フォー」「コーヒー」「寺院」で検索してみてください...",
            ["ko"] = "\"쌀국수\", \"커피\", \"유적지\"로 검색해보세요...",
            ["zh-Hans"] = "尝试搜索\"牛肉粉\"、\"咖啡\"、\"古迹\"...",
            ["fr"] = "Essayez \"bún bò\", \"café\", \"temple\"...",
            ["th"] = "ลองค้นหา \"เฝอ\", \"กาแฟ\", \"วัด\"..."
        },
        ["search_offline_title"] = new()
        {
            ["vi"] = "Bạn đang ngoại tuyến", ["en"] = "You are offline", ["ja"] = "オフラインです",
            ["ko"] = "오프라인 상태입니다", ["zh-Hans"] = "您已离线", ["fr"] = "Vous êtes hors ligne", ["th"] = "คุณออฟไลน์อยู่"
        },
        ["search_offline_subtitle"] = new()
        {
            ["vi"] = "App chưa có dữ liệu điểm đến để tìm kiếm offline. Vui lòng thử lại khi có mạng.",
            ["en"] = "No cached destination data for offline search. Please try again when connected.",
            ["ja"] = "オフライン検索用のキャッシュデータがありません。接続時にもう一度お試しください。",
            ["ko"] = "오프라인 검색을 위한 캐시 데이터가 없습니다. 연결 후 다시 시도해주세요.",
            ["zh-Hans"] = "没有缓存的目的地数据用于离线搜索。请在联网后重试。",
            ["fr"] = "Pas de données en cache pour la recherche hors ligne. Veuillez réessayer lorsque vous êtes connecté.",
            ["th"] = "ไม่มีข้อมูลแคชสำหรับค้นหาออฟไลน์ กรุณาลองใหม่เมื่อเชื่อมต่อ"
        },
        ["search_section_poi"] = new()
        {
            ["vi"] = "Địa điểm", ["en"] = "Places", ["ja"] = "スポット",
            ["ko"] = "장소", ["zh-Hans"] = "地点", ["fr"] = "Lieux", ["th"] = "สถานที่"
        },
        ["search_section_tour"] = new()
        {
            ["vi"] = "Tour nổi bật", ["en"] = "Featured tours", ["ja"] = "注目ツアー",
            ["ko"] = "인기 투어", ["zh-Hans"] = "精选旅游", ["fr"] = "Circuits en vedette", ["th"] = "ทัวร์แนะนำ"
        },
        ["search_poi_points"] = new()
        {
            ["vi"] = "📍 {0} điểm", ["en"] = "📍 {0} spots", ["ja"] = "📍 {0}スポット",
            ["ko"] = "📍 {0}개 장소", ["zh-Hans"] = "📍 {0}个地点", ["fr"] = "📍 {0} points", ["th"] = "📍 {0} จุด"
        },

        // ═══════════════════════════════════════════════════════════════
        // MapPage
        // ═══════════════════════════════════════════════════════════════
        ["map_title"] = new()
        {
            ["vi"] = "Bản đồ", ["en"] = "Map", ["ja"] = "地図",
            ["ko"] = "지도", ["zh-Hans"] = "地图", ["fr"] = "Carte", ["th"] = "แผนที่"
        },
        ["map_listen"] = new()
        {
            ["vi"] = "Nghe", ["en"] = "Listen", ["ja"] = "聴く",
            ["ko"] = "듣기", ["zh-Hans"] = "收听", ["fr"] = "Écouter", ["th"] = "ฟัง"
        },
        ["map_details"] = new()
        {
            ["vi"] = "Chi tiết", ["en"] = "Details", ["ja"] = "詳細",
            ["ko"] = "상세", ["zh-Hans"] = "详情", ["fr"] = "Détails", ["th"] = "รายละเอียด"
        },
        ["map_directions"] = new()
        {
            ["vi"] = "Dẫn đường", ["en"] = "Directions", ["ja"] = "ルート案内",
            ["ko"] = "길찾기", ["zh-Hans"] = "导航", ["fr"] = "Itinéraire", ["th"] = "เส้นทาง"
        },
        ["map_status"] = new()
        {
            ["vi"] = "Đang tải bản đồ...", ["en"] = "Loading map...", ["ja"] = "マップを読み込み中...",
            ["ko"] = "지도 로드 중...", ["zh-Hans"] = "正在加载地图...", ["fr"] = "Chargement de la carte...", ["th"] = "กำลังโหลดแผนที่..."
        },
        ["map_distance_m"] = new()
        {
            ["vi"] = "cách {0}m", ["en"] = "{0}m away", ["ja"] = "{0}m先",
            ["ko"] = "{0}m 거리", ["zh-Hans"] = "距离{0}米", ["fr"] = "à {0} m", ["th"] = "ห่าง {0} เมตร"
        },
        ["map_distance_km"] = new()
        {
            ["vi"] = "cách {0}km", ["en"] = "{0}km away", ["ja"] = "{0}km先",
            ["ko"] = "{0}km 거리", ["zh-Hans"] = "距离{0}公里", ["fr"] = "à {0} km", ["th"] = "ห่าง {0} กม."
        },
        ["map_walk_time"] = new()
        {
            ["vi"] = "~{0} phút đi bộ", ["en"] = "~{0} min walk", ["ja"] = "徒歩約{0}分",
            ["ko"] = "도보 약 {0}분", ["zh-Hans"] = "步行约{0}分钟", ["fr"] = "~{0} min à pied", ["th"] = "เดินประมาณ {0} นาที"
        },

        // ═══════════════════════════════════════════════════════════════
        // SettingsPage
        // ═══════════════════════════════════════════════════════════════
        ["settings_title"] = new()
        {
            ["vi"] = "Cài Đặt", ["en"] = "Settings", ["ja"] = "設定",
            ["ko"] = "설정", ["zh-Hans"] = "设置", ["fr"] = "Paramètres", ["th"] = "ตั้งค่า"
        },
        ["settings_lang_title"] = new()
        {
            ["vi"] = "Ngôn Ngữ", ["en"] = "Language", ["ja"] = "言語",
            ["ko"] = "언어", ["zh-Hans"] = "语言", ["fr"] = "Langue", ["th"] = "ภาษา"
        },
        ["settings_lang_choose"] = new()
        {
            ["vi"] = "Chọn ngôn ngữ ứng dụng", ["en"] = "Choose app language", ["ja"] = "アプリの言語を選択",
            ["ko"] = "앱 언어 선택", ["zh-Hans"] = "选择应用语言", ["fr"] = "Choisir la langue de l'application", ["th"] = "เลือกภาษาแอป"
        },
        ["settings_lang_change_btn"] = new()
        {
            ["vi"] = "ĐỔI NGÔN NGỮ", ["en"] = "CHANGE LANGUAGE", ["ja"] = "言語を変更",
            ["ko"] = "언어 변경", ["zh-Hans"] = "更改语言", ["fr"] = "CHANGER LA LANGUE", ["th"] = "เปลี่ยนภาษา"
        },
        ["settings_lang_sheet_title"] = new()
        {
            ["vi"] = "Chọn ngôn ngữ", ["en"] = "Select language", ["ja"] = "言語を選択",
            ["ko"] = "언어 선택", ["zh-Hans"] = "选择语言", ["fr"] = "Sélectionner la langue", ["th"] = "เลือกภาษา"
        },
        ["settings_lang_sheet_cancel"] = new()
        {
            ["vi"] = "Hủy", ["en"] = "Cancel", ["ja"] = "キャンセル",
            ["ko"] = "취소", ["zh-Hans"] = "取消", ["fr"] = "Annuler", ["th"] = "ยกเลิก"
        },
        ["settings_data_title"] = new()
        {
            ["vi"] = "Dữ Liệu", ["en"] = "Data", ["ja"] = "データ",
            ["ko"] = "데이터", ["zh-Hans"] = "数据", ["fr"] = "Données", ["th"] = "ข้อมูล"
        },
        ["settings_cellular_title"] = new()
        {
            ["vi"] = "Tải qua 4G/5G", ["en"] = "Download via 4G/5G", ["ja"] = "4G/5Gでダウンロード",
            ["ko"] = "4G/5G로 다운로드", ["zh-Hans"] = "通过4G/5G下载", ["fr"] = "Télécharger via 4G/5G", ["th"] = "ดาวน์โหลดผ่าน 4G/5G"
        },
        ["settings_cellular_on"] = new()
        {
            ["vi"] = "Wi-Fi + 4G/5G", ["en"] = "Wi-Fi + 4G/5G", ["ja"] = "Wi-Fi + 4G/5G",
            ["ko"] = "Wi-Fi + 4G/5G", ["zh-Hans"] = "Wi-Fi + 4G/5G", ["fr"] = "Wi-Fi + 4G/5G", ["th"] = "Wi-Fi + 4G/5G"
        },
        ["settings_cellular_off"] = new()
        {
            ["vi"] = "Chỉ Wi-Fi", ["en"] = "Wi-Fi only", ["ja"] = "Wi-Fiのみ",
            ["ko"] = "Wi-Fi만", ["zh-Hans"] = "仅Wi-Fi", ["fr"] = "Wi-Fi uniquement", ["th"] = "เฉพาะ Wi-Fi"
        },

        // ═══════════════════════════════════════════════════════════════
        // Categories
        // ═══════════════════════════════════════════════════════════════
        ["cat_all"] = new()
        {
            ["vi"] = "Tất cả", ["en"] = "All", ["ja"] = "すべて",
            ["ko"] = "전체", ["zh-Hans"] = "全部", ["fr"] = "Tout", ["th"] = "ทั้งหมด"
        },
        ["cat_food"] = new()
        {
            ["vi"] = "Ẩm thực", ["en"] = "Food", ["ja"] = "グルメ",
            ["ko"] = "맛집", ["zh-Hans"] = "美食", ["fr"] = "Gastronomie", ["th"] = "อาหาร"
        },
        ["cat_historical"] = new()
        {
            ["vi"] = "Di tích", ["en"] = "Historical", ["ja"] = "史跡",
            ["ko"] = "유적", ["zh-Hans"] = "古迹", ["fr"] = "Historique", ["th"] = "โบราณสถาน"
        },
        ["cat_coffee"] = new()
        {
            ["vi"] = "Cà phê", ["en"] = "Coffee", ["ja"] = "カフェ",
            ["ko"] = "카페", ["zh-Hans"] = "咖啡", ["fr"] = "Café", ["th"] = "กาแฟ"
        },
        ["cat_shopping"] = new()
        {
            ["vi"] = "Mua sắm", ["en"] = "Shopping", ["ja"] = "ショッピング",
            ["ko"] = "쇼핑", ["zh-Hans"] = "购物", ["fr"] = "Shopping", ["th"] = "ช้อปปิ้ง"
        },
        ["cat_entertainment"] = new()
        {
            ["vi"] = "Giải trí", ["en"] = "Entertainment", ["ja"] = "エンタメ",
            ["ko"] = "엔터테인먼트", ["zh-Hans"] = "娱乐", ["fr"] = "Divertissement", ["th"] = "บันเทิง"
        },
        ["cat_culture"] = new()
        {
            ["vi"] = "Văn hóa", ["en"] = "Culture", ["ja"] = "文化",
            ["ko"] = "문화", ["zh-Hans"] = "文化", ["fr"] = "Culture", ["th"] = "วัฒนธรรม"
        },

        // ═══════════════════════════════════════════════════════════════
        // Popups / Alerts
        // ═══════════════════════════════════════════════════════════════
        ["popup_success"] = new()
        {
            ["vi"] = "Thành công", ["en"] = "Success", ["ja"] = "成功",
            ["ko"] = "성공", ["zh-Hans"] = "成功", ["fr"] = "Succès", ["th"] = "สำเร็จ"
        },
        ["popup_lang_changed"] = new()
        {
            ["vi"] = "Đã chuyển ngôn ngữ sang {0}", ["en"] = "Language changed to {0}", ["ja"] = "言語を{0}に変更しました",
            ["ko"] = "언어가 {0}(으)로 변경되었습니다", ["zh-Hans"] = "语言已切换为{0}", ["fr"] = "Langue changée en {0}", ["th"] = "เปลี่ยนภาษาเป็น {0} แล้ว"
        },
        ["popup_error"] = new()
        {
            ["vi"] = "Lỗi cập nhật", ["en"] = "Update error", ["ja"] = "更新エラー",
            ["ko"] = "업데이트 오류", ["zh-Hans"] = "更新错误", ["fr"] = "Erreur de mise à jour", ["th"] = "ข้อผิดพลาดในการอัปเดต"
        },
        ["popup_offline_msg"] = new()
        {
            ["vi"] = "Không thể đổi ngôn ngữ do không tải được dữ liệu. Vui lòng kết nối Wi-Fi hoặc bật 'Tải qua 4G/5G'.",
            ["en"] = "Unable to change language because data could not be downloaded. Please connect to Wi-Fi or enable 'Download via 4G/5G'.",
            ["ja"] = "データをダウンロードできないため、言語を変更できません。Wi-Fiに接続するか、「4G/5Gでダウンロード」を有効にしてください。",
            ["ko"] = "데이터를 다운로드할 수 없어 언어를 변경할 수 없습니다. Wi-Fi에 연결하거나 '4G/5G로 다운로드'를 활성화해주세요.",
            ["zh-Hans"] = "无法更改语言，因为无法下载数据。请连接Wi-Fi或启用'通过4G/5G下载'。",
            ["fr"] = "Impossible de changer la langue car les données n'ont pas pu être téléchargées. Veuillez vous connecter au Wi-Fi ou activer 'Télécharger via 4G/5G'.",
            ["th"] = "ไม่สามารถเปลี่ยนภาษาได้เนื่องจากไม่สามารถดาวน์โหลดข้อมูล กรุณาเชื่อมต่อ Wi-Fi หรือเปิด 'ดาวน์โหลดผ่าน 4G/5G'"
        },
        ["popup_ok"] = new()
        {
            ["vi"] = "OK", ["en"] = "OK", ["ja"] = "OK",
            ["ko"] = "확인", ["zh-Hans"] = "确定", ["fr"] = "OK", ["th"] = "ตกลง"
        },
        ["popup_close"] = new()
        {
            ["vi"] = "Đóng", ["en"] = "Close", ["ja"] = "閉じる",
            ["ko"] = "닫기", ["zh-Hans"] = "关闭", ["fr"] = "Fermer", ["th"] = "ปิด"
        },

        // ═══════════════════════════════════════════════════════════════
        // Misc / Errors
        // ═══════════════════════════════════════════════════════════════
        ["error_prefix"] = new()
        {
            ["vi"] = "Lỗi: {0}", ["en"] = "Error: {0}", ["ja"] = "エラー: {0}",
            ["ko"] = "오류: {0}", ["zh-Hans"] = "错误: {0}", ["fr"] = "Erreur : {0}", ["th"] = "ข้อผิดพลาด: {0}"
        },
        ["status_updating_lang"] = new()
        {
            ["vi"] = "Đang cập nhật ngôn ngữ...", ["en"] = "Updating language...", ["ja"] = "言語を更新中...",
            ["ko"] = "언어 업데이트 중...", ["zh-Hans"] = "正在更新语言...", ["fr"] = "Mise à jour de la langue...", ["th"] = "กำลังอัปเดตภาษา..."
        },
        ["status_downloading_cellular"] = new()
        {
            ["vi"] = "Đang tải tài nguyên nền bằng mạng hiện tại...",
            ["en"] = "Downloading resources in the background using current network...",
            ["ja"] = "現在のネットワークでバックグラウンドリソースをダウンロード中...",
            ["ko"] = "현재 네트워크로 백그라운드 리소스 다운로드 중...",
            ["zh-Hans"] = "正在使用当前网络在后台下载资源...",
            ["fr"] = "Téléchargement des ressources en arrière-plan via le réseau actuel...",
            ["th"] = "กำลังดาวน์โหลดทรัพยากรเบื้องหลังผ่านเครือข่ายปัจจุบัน..."
        },
        ["status_wifi_only"] = new()
        {
            ["vi"] = "Đã bật chế độ chỉ tải ngầm khi có Wi-Fi.",
            ["en"] = "Wi-Fi only download mode enabled.",
            ["ja"] = "Wi-Fiのみのダウンロードモードが有効になりました。",
            ["ko"] = "Wi-Fi 전용 다운로드 모드가 활성화되었습니다.",
            ["zh-Hans"] = "已启用仅Wi-Fi下载模式。",
            ["fr"] = "Mode de téléchargement Wi-Fi uniquement activé.",
            ["th"] = "เปิดโหมดดาวน์โหลดเฉพาะ Wi-Fi แล้ว"
        },

        // ═══════════════════════════════════════════════════════════════
        // PoiDetailPage
        // ═══════════════════════════════════════════════════════════════
        ["detail_title"] = new()
        {
            ["vi"] = "Chi tiết điểm", ["en"] = "Spot Details", ["ja"] = "スポット詳細",
            ["ko"] = "장소 상세", ["zh-Hans"] = "景点详情", ["fr"] = "Détails du point", ["th"] = "รายละเอียดจุด"
        },
        ["detail_image"] = new()
        {
            ["vi"] = "Ảnh", ["en"] = "Photos", ["ja"] = "写真",
            ["ko"] = "사진", ["zh-Hans"] = "照片", ["fr"] = "Photos", ["th"] = "รูปภาพ"
        },
        ["detail_gallery_count"] = new()
        {
            ["vi"] = "{0} ảnh", ["en"] = "{0} photos", ["ja"] = "写真{0}枚",
            ["ko"] = "사진 {0}장", ["zh-Hans"] = "{0}张照片", ["fr"] = "{0} photos", ["th"] = "{0} รูป"
        },
        ["detail_view_all"] = new()
        {
            ["vi"] = "Xem tất cả →", ["en"] = "View all →", ["ja"] = "すべて見る →",
            ["ko"] = "모두 보기 →", ["zh-Hans"] = "查看全部 →", ["fr"] = "Voir tout →", ["th"] = "ดูทั้งหมด →"
        },
        ["detail_audio"] = new()
        {
            ["vi"] = "Thuyết minh âm thanh", ["en"] = "Audio Guide", ["ja"] = "音声ガイド",
            ["ko"] = "오디오 가이드", ["zh-Hans"] = "语音导览", ["fr"] = "Guide audio", ["th"] = "ไกด์เสียง"
        },
        ["detail_intro"] = new()
        {
            ["vi"] = "Giới thiệu", ["en"] = "Introduction", ["ja"] = "紹介",
            ["ko"] = "소개", ["zh-Hans"] = "介绍", ["fr"] = "Introduction", ["th"] = "บทนำ"
        },
        ["detail_collapse"] = new()
        {
            ["vi"] = "Thu gọn ▲", ["en"] = "Collapse ▲", ["ja"] = "折りたたむ ▲",
            ["ko"] = "접기 ▲", ["zh-Hans"] = "收起 ▲", ["fr"] = "Réduire ▲", ["th"] = "ยุบ ▲"
        },
        ["detail_expand"] = new()
        {
            ["vi"] = "Xem thêm ▼", ["en"] = "Expand ▼", ["ja"] = "もっと見る ▼",
            ["ko"] = "더보기 ▼", ["zh-Hans"] = "展开 ▼", ["fr"] = "Afficher plus ▼", ["th"] = "ดูเพิ่ม ▼"
        },
        ["detail_next"] = new()
        {
            ["vi"] = "Tiếp theo", ["en"] = "Next", ["ja"] = "次へ",
            ["ko"] = "다음", ["zh-Hans"] = "下一步", ["fr"] = "Suivant", ["th"] = "ถัดไป"
        },
        ["detail_next_button"] = new()
        {
            ["vi"] = "Điểm tiếp theo →", ["en"] = "Next Spot →", ["ja"] = "次のスポット →",
            ["ko"] = "다음 장소 →", ["zh-Hans"] = "下一个地点 →", ["fr"] = "Point suivant →", ["th"] = "จุดถัดไป →"
        },
        ["detail_next_end"] = new()
        {
            ["vi"] = "Đã đến điểm cuối", ["en"] = "End of Tour", ["ja"] = "ツアー終了",
            ["ko"] = "투어 종료", ["zh-Hans"] = "行程结束", ["fr"] = "Fin du parcours", ["th"] = "สิ้นสุดทัวร์"
        },

        // ═══════════════════════════════════════════════════════════════
        // Language Switch Popup (localized in target language)
        // ═══════════════════════════════════════════════════════════════
        ["lang_switch_success_title"] = new()
        {
            ["vi"] = "Thành công", ["en"] = "Success", ["ja"] = "成功",
            ["ko"] = "성공", ["zh-Hans"] = "成功", ["fr"] = "Succès", ["th"] = "สำเร็จ"
        },
        ["lang_switch_success"] = new()
        {
            ["vi"] = "Đã chuyển ngôn ngữ sang", ["en"] = "Language changed to", ["ja"] = "言語を変更しました:",
            ["ko"] = "언어 변경됨:", ["zh-Hans"] = "语言已切换为", ["fr"] = "Langue changée en", ["th"] = "เปลี่ยนภาษาเป็น"
        },
        ["lang_switch_error_title"] = new()
        {
            ["vi"] = "Lỗi cập nhật", ["en"] = "Update Error", ["ja"] = "更新エラー",
            ["ko"] = "업데이트 오류", ["zh-Hans"] = "更新错误", ["fr"] = "Erreur de mise à jour", ["th"] = "ข้อผิดพลาดในการอัปเดต"
        },
        ["lang_switch_error_msg"] = new()
        {
            ["vi"] = "Không thể đổi ngôn ngữ do không có kết nối mạng hoặc không tải được dữ liệu. Vui lòng bật Wi-Fi hoặc cho phép tải qua 4G/5G.",
            ["en"] = "Cannot change language: no network connection or data could not be downloaded. Please enable Wi-Fi or allow 4G/5G downloads.",
            ["ja"] = "ネットワーク接続またはデータのダウンロードに失敗したため、言語を変更できません。Wi-Fiを有効にするか4G/5Gダウンロードを許可してください。",
            ["ko"] = "네트워크 연결이 없거나 데이터를 다운로드할 수 없어 언어를 변경할 수 없습니다. Wi-Fi를 활성화하거나 4G/5G 다운로드를 허용해주세요.",
            ["zh-Hans"] = "无法更改语言：没有网络连接或无法下载数据。请启用Wi-Fi或允许4G/5G下载。",
            ["fr"] = "Impossible de changer la langue : pas de connexion réseau ou les données n'ont pas pu être téléchargées. Veuillez activer le Wi-Fi ou autoriser les téléchargements via 4G/5G.",
            ["th"] = "ไม่สามารถเปลี่ยนภาษาได้: ไม่มีการเชื่อมต่อเครือข่ายหรือไม่สามารถดาวน์โหลดข้อมูล กรุณาเปิด Wi-Fi หรืออนุญาตการดาวน์โหลดผ่าน 4G/5G"
        },
        // ═══════════════════════════════════════════════════════════════
        // Tour related
        // ═══════════════════════════════════════════════════════════════
        ["tour_list_tours"] = new()
        {
            ["vi"] = "Tours", ["en"] = "Tours", ["ja"] = "ツアー",
            ["ko"] = "투어", ["zh-Hans"] = "游览", ["fr"] = "Tours", ["th"] = "ทัวร์"
        },
        ["tour_list_count"] = new()
        {
            ["vi"] = "{0} tour quanh bạn", ["en"] = "{0} tours nearby", ["ja"] = "近くの {0} ツアー",
            ["ko"] = "주변 {0}개 투어", ["zh-Hans"] = "附近有 {0} 个游览", ["fr"] = "{0} circuits à proximité", ["th"] = "ทัวร์ใกล้เคียง {0} รายการ"
        },
        ["tour_list_empty_title"] = new()
        {
            ["vi"] = "Chưa có tour nào", ["en"] = "No tours yet", ["ja"] = "ツアーはまだありません",
            ["ko"] = "아직 투어가 없습니다", ["zh-Hans"] = "还没有游览", ["fr"] = "Aucun circuit pour le moment", ["th"] = "ยังไม่มีทัวร์"
        },
        ["tour_list_empty_desc"] = new()
        {
            ["vi"] = "Tạo tour đầu tiên của bạn để bắt đầu khám phá Phố Ẩm Thực Vĩnh Khánh",
            ["en"] = "Create your first tour to start exploring Vinh Khanh Food Street",
            ["ja"] = "最初のツアーを作成して、ヴィンカイングルメストリートの探索を始めましょう",
            ["ko"] = "첫 투어를 만들어 빈카인 먹자골목 탐험을 시작하세요",
            ["zh-Hans"] = "创建您的第一个游览，开始探索永庆美食街",
            ["fr"] = "Créez votre premier circuit pour explorer la rue gastronomique Vinh Khanh",
            ["th"] = "สร้างทัวร์แรกของคุณเพื่อเริ่มสำรวจถนนอาหารวิญคานห์"
        },
        ["tour_list_create_btn"] = new()
        {
            ["vi"] = "Tạo Tour Mới", ["en"] = "Create New Tour", ["ja"] = "新しいツアーを作成",
            ["ko"] = "새 투어 만들기", ["zh-Hans"] = "创建新游览", ["fr"] = "Créer un nouveau circuit", ["th"] = "สร้างทัวร์ใหม่"
        },
        ["tour_progress"] = new()
        {
            ["vi"] = "Tiến độ", ["en"] = "Progress", ["ja"] = "進捗",
            ["ko"] = "진행", ["zh-Hans"] = "进度", ["fr"] = "Progrès", ["th"] = "ความคืบหน้า"
        },
        ["tour_points"] = new()
        {
            ["vi"] = "điểm", ["en"] = "points", ["ja"] = "ポイント",
            ["ko"] = "포인트", ["zh-Hans"] = "点数", ["fr"] = "points", ["th"] = "จุด"
        },
        ["tour_minutes"] = new()
        {
            ["vi"] = "phút", ["en"] = "mins", ["ja"] = "分",
            ["ko"] = "분", ["zh-Hans"] = "分钟", ["fr"] = "mins", ["th"] = "นาที"
        },
        ["tour_lang"] = new()
        {
            ["vi"] = "ngôn ngữ", ["en"] = "lang", ["ja"] = "言語",
            ["ko"] = "언어", ["zh-Hans"] = "语言", ["fr"] = "lang", ["th"] = "ภาษา"
        },
        ["tour_continue"] = new()
        {
            ["vi"] = "Tiếp tục Tour", ["en"] = "Continue Tour", ["ja"] = "ツアーを続ける",
            ["ko"] = "투어 계속하기", ["zh-Hans"] = "继续游览", ["fr"] = "Continuer le circuit", ["th"] = "ดำเนินการทัวร์ต่อ"
        },

        ["create_tour_title"] = new()
        {
            ["vi"] = "Tạo Tour Mới", ["en"] = "Create New Tour", ["ja"] = "新しいツアーを作成",
            ["ko"] = "새 투어 만들기", ["zh-Hans"] = "创建新游览", ["fr"] = "Créer un nouveau circuit", ["th"] = "สร้างทัวร์ใหม่"
        },
        ["create_tour_name"] = new()
        {
            ["vi"] = "Tên Tour *", ["en"] = "Tour Name *", ["ja"] = "ツアー名 *",
            ["ko"] = "투어 이름 *", ["zh-Hans"] = "游览名称 *", ["fr"] = "Nom du circuit *", ["th"] = "ชื่อทัวร์ *"
        },
        ["create_tour_name_placeholder"] = new()
        {
            ["vi"] = "VD: Tour Ẩm Thực Vĩnh Khánh", ["en"] = "Ex: Vinh Khanh Food Tour", ["ja"] = "例: ヴィンカイングルメツアー",
            ["ko"] = "예: 빈카인 먹자골목 투어", ["zh-Hans"] = "例：永庆美食游览", ["fr"] = "Ex: Circuit gastronomique Vinh Khanh", ["th"] = "ตัวอย่าง: ทัวร์อาหารวิญคานห์"
        },
        ["create_tour_desc"] = new()
        {
            ["vi"] = "Mô tả", ["en"] = "Description", ["ja"] = "説明",
            ["ko"] = "설명", ["zh-Hans"] = "描述", ["fr"] = "Description", ["th"] = "คำอธิบาย"
        },
        ["create_tour_desc_placeholder"] = new()
        {
            ["vi"] = "Mô tả ngắn về hành trình...", ["en"] = "Short description of the journey...", ["ja"] = "旅の短い説明...",
            ["ko"] = "여정에 대한 짧은 설명...", ["zh-Hans"] = "旅程的简短描述...", ["fr"] = "Courte description du voyage...", ["th"] = "คำอธิบายสั้นๆ เกี่ยวกับการเดินทาง..."
        },
        ["create_tour_lang"] = new()
        {
            ["vi"] = "Ngôn ngữ thuyết minh", ["en"] = "Audio Language", ["ja"] = "音声言語",
            ["ko"] = "오디오 언어", ["zh-Hans"] = "音频语言", ["fr"] = "Langue audio", ["th"] = "ภาษาเสียง"
        },
        ["create_tour_cat"] = new()
        {
            ["vi"] = "Danh mục", ["en"] = "Categories", ["ja"] = "カテゴリー",
            ["ko"] = "카테고리", ["zh-Hans"] = "类别", ["fr"] = "Catégories", ["th"] = "หมวดหมู่"
        },
        ["create_tour_sort"] = new()
        {
            ["vi"] = "Sắp xếp", ["en"] = "Sort", ["ja"] = "並べ替え",
            ["ko"] = "정렬", ["zh-Hans"] = "分类", ["fr"] = "Trier", ["th"] = "เรียงลำดับ"
        },
        ["create_tour_add_stop"] = new()
        {
            ["vi"] = "Thêm điểm dừng mới", ["en"] = "Add new stop", ["ja"] = "新しい停留所を追加",
            ["ko"] = "새 정류장 추가", ["zh-Hans"] = "添加新站", ["fr"] = "Ajouter un nouvel arrêt", ["th"] = "เพิ่มจุดหยุดใหม่"
        },
        ["create_tour_preview"] = new()
        {
            ["vi"] = "Xem trước lộ trình", ["en"] = "Preview Route", ["ja"] = "ルートのプレビュー",
            ["ko"] = "경로 미리보기", ["zh-Hans"] = "预览路线", ["fr"] = "Aperçu de l'itinéraire", ["th"] = "ดูเส้นทางล่วงหน้า"
        },
        ["create_tour_save"] = new()
        {
            ["vi"] = "Lưu Tour", ["en"] = "Save Tour", ["ja"] = "ツアーを保存",
            ["ko"] = "투어 저장", ["zh-Hans"] = "保存游览", ["fr"] = "Enregistrer le circuit", ["th"] = "บันทึกทัวร์"
        },
        ["create_tour_stop_count"] = new()
        {
            ["vi"] = "Điểm dừng ({0})", ["en"] = "Stops ({0})", ["ja"] = "停留所 ({0})",
            ["ko"] = "정류장 ({0})", ["zh-Hans"] = "停靠点 ({0})", ["fr"] = "Arrêts ({0})", ["th"] = "จุดหยุด ({0})"
        },

        ["tour_detail_continue"] = new()
        {
            ["vi"] = "▶  Tiếp tục Tour", ["en"] = "▶  Continue Tour", ["ja"] = "▶  ツアーを続ける",
            ["ko"] = "▶  투어 계속하기", ["zh-Hans"] = "▶  继续游览", ["fr"] = "▶  Continuer le circuit", ["th"] = "▶  ดำเนินการทัวร์ต่อ"
        },
        ["tour_detail_map"] = new()
        {
            ["vi"] = "Bản đồ", ["en"] = "Map", ["ja"] = "地図",
            ["ko"] = "지도", ["zh-Hans"] = "地图", ["fr"] = "Carte", ["th"] = "แผนที่"
        },
        ["tour_detail_stop_list"] = new()
        {
            ["vi"] = "Danh sách điểm dừng", ["en"] = "Stop List", ["ja"] = "停留所リスト",
            ["ko"] = "정류장 목록", ["zh-Hans"] = "停靠点列表", ["fr"] = "Liste des arrêts", ["th"] = "รายการจุดหยุด"
        },
        ["tour_load_err"] = new()
        {
            ["vi"] = "Không tải được tour", ["en"] = "Failed to load tour", ["ja"] = "ツアーを読み込めませんでした",
            ["ko"] = "투어를 불러오지 못했습니다", ["zh-Hans"] = "无法加载游览", ["fr"] = "Échec du chargement du circuit", ["th"] = "ไม่สามารถโหลดทัวร์ได้"
        },


        // ── Shared button labels ──────────────────────────────────────────
        ["ok"] = new()
        {
            ["vi"] = "OK", ["en"] = "OK", ["ja"] = "OK",
            ["ko"] = "확인", ["zh-Hans"] = "确定", ["fr"] = "OK", ["th"] = "ตกลง"
        },
        ["close"] = new()
        {
            ["vi"] = "Đóng", ["en"] = "Close", ["ja"] = "閉じる",
            ["ko"] = "닫기", ["zh-Hans"] = "关闭", ["fr"] = "Fermer", ["th"] = "ปิด"
        },

        // ── SettingsViewModel label aliases ───────────────────────────────
        ["settings_language"] = new()
        {
            ["vi"] = "Ngôn Ngữ", ["en"] = "Language", ["ja"] = "言語",
            ["ko"] = "언어", ["zh-Hans"] = "语言", ["fr"] = "Langue", ["th"] = "ภาษา"
        },
        ["settings_download"] = new()
        {
            ["vi"] = "Tải Dữ Liệu", ["en"] = "Data Download", ["ja"] = "データダウンロード",
            ["ko"] = "데이터 다운로드", ["zh-Hans"] = "数据下载", ["fr"] = "Téléchargement de données", ["th"] = "ดาวน์โหลดข้อมูล"
        },
        ["settings_cellular"] = new()
        {
            ["vi"] = "Tải qua 4G/5G", ["en"] = "Download via 4G/5G", ["ja"] = "4G/5Gでダウンロード",
            ["ko"] = "4G/5G로 다운로드", ["zh-Hans"] = "通过4G/5G下载", ["fr"] = "Télécharger via 4G/5G", ["th"] = "ดาวน์โหลดผ่าน 4G/5G"
        },
        ["settings_version"] = new()
        {
            ["vi"] = "Phiên bản ứng dụng", ["en"] = "App Version", ["ja"] = "アプリのバージョン",
            ["ko"] = "앱 버전", ["zh-Hans"] = "应用程序版本", ["fr"] = "Version de l'application", ["th"] = "เวอร์ชันแอป"
        },
    };

    /// <summary>
    /// Reverse map: Vietnamese category name → AppStrings key.
    /// Used to translate DB category names (always Vietnamese) into the current UI language.
    /// </summary>
    private static readonly Dictionary<string, string> _categoryKeyMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ẩm thực"]  = "cat_food",
        ["di tích"]  = "cat_historical",
        ["cà phê"]   = "cat_coffee",
        ["mua sắm"]  = "cat_shopping",
        ["giải trí"] = "cat_entertainment",
        ["văn hóa"]  = "cat_culture",
    };

    /// <summary>
    /// Get a translated string for the current app language.
    /// Supports {0}, {1} placeholders via string.Format.
    /// </summary>
    public static string Get(string key, params object[] args)
    {
        var lang = AppSettings.GetAppLanguage();
        return GetForLanguage(key, lang, args);
    }

    /// <summary>
    /// Get a translated string for a specific language.
    /// </summary>
    public static string GetForLanguage(string key, string lang, params object[] args)
    {
        string text = key; // fallback = key itself

        if (_strings.TryGetValue(key, out var translations))
        {
            if (translations.TryGetValue(lang, out var t))
                text = t;
            else if (translations.TryGetValue("vi", out var viFb))
                text = viFb;
            else if (translations.TryGetValue("en", out var enFb))
                text = enFb;
        }

        return args.Length > 0 ? string.Format(text, args) : text;
    }

    /// <summary>
    /// Translate a Vietnamese category name to the current UI language.
    /// If the category is unknown, returns the original name.
    /// </summary>
    public static string TranslateCategory(string viCategoryName)
    {
        if (_categoryKeyMap.TryGetValue(viCategoryName, out var key))
            return Get(key);
        return viCategoryName;
    }
}
