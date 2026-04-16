import { useState, useEffect } from "react";
import { 
    QrCode, 
    Plus, 
    Trash2, 
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { accessCodeApi } from "../api/accessCodeApi";

export default function AccessCodePage() {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Create new codes
    const [generateCount, setGenerateCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);

    // QR Preview
    const [previewCode, setPreviewCode] = useState(null);
    const [previewQrUri, setPreviewQrUri] = useState(null);

    useEffect(() => {
        fetchCodes();
    }, [page]);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const res = await accessCodeApi.getAccessCodes(page, 6);
            if (res.data && res.data.data) {
                setCodes(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch codes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCodes = async () => {
        setIsGenerating(true);
        try {
            await accessCodeApi.createCodes(generateCount);
            setPage(1); // Reset to page 1 to see the newest
            fetchCodes();
        } catch (error) {
            console.error("Failed to generate codes:", error);
            alert("Lỗi khi tạo mã: " + (error.response?.data || error.message));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Bạn có chắc chắn muốn xóa mã truy cập này?")) return;
        try {
            await accessCodeApi.deleteCode(id);
            fetchCodes();
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    const handleShowQr = async (codeStr) => {
        setPreviewCode(codeStr);
        setPreviewQrUri(null); // Show loading
        try {
            const res = await accessCodeApi.getQrImageUrl(codeStr);
            if (res.data?.dataUri) {
                setPreviewQrUri(res.data.dataUri);
            }
        } catch (error) {
            console.error("Lỗi lấy mã QR:", error);
            alert("Không thể tải mã QR");
            setPreviewCode(null);
        }
    };

    const downloadQr = () => {
        if (!previewQrUri) return;
        const link = document.createElement('a');
        link.href = previewQrUri;
        link.download = `AudioGo_AccessCode_${previewCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const gridLayout = "grid grid-cols-[1.5fr_1.2fr_1.2fr_1.2fr_1.2fr_1fr] lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_0.8fr]";

    return (
        <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase">
                        Quản lý Mã truy cập
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Khách du lịch chỉ cần quét mã tĩnh để nhận vé (Token 7 ngày) truy cập tất cả tính năng.
                    </p>
                </div>
            </div>

            {/* Content box */}
            <div className="flex flex-col xl:flex-row gap-6 items-start">
                
                {/* Left content: Generating new codes */}
                <div className="xl:w-1/4 w-full bg-white rounded-2xl border p-6 flex flex-col gap-4 sticky top-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-pink-500" /> Gen mã hàng loạt
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">
                        Tạo ra những mã ngẫu nhiên duy nhất dùng để in vé cấp quyền truy cập.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Số lượng vé muốn tạo</label>
                            <input 
                                type="number" 
                                min="1" max="100" 
                                className="w-full flex h-10 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                value={generateCount}
                                onChange={e => setGenerateCount(Number(e.target.value))}
                            />
                        </div>
                        <button 
                            disabled={isGenerating}
                            onClick={handleCreateCodes}
                            className={`w-full font-bold inline-flex items-center justify-center rounded-lg text-sm transition-colors h-10 px-4 py-2 ${isGenerating ? 'bg-pink-300 text-white cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600'}`}
                        >
                            {isGenerating ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...</> : "TẠO MÃ MỚI"}
                        </button>
                    </div>

                    {/* QR Code Preview Box */}
                    {previewCode && (
                        <div className="mt-6 p-4 border border-pink-100 bg-pink-50/50 rounded-xl flex flex-col items-center">
                            <h3 className="font-bold text-pink-500 text-center mb-3">Mã: {previewCode}</h3>
                            {previewQrUri ? (
                                <div className="space-y-4 w-full flex flex-col items-center">
                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                        <img src={previewQrUri} alt="QR Code" className="w-[180px] h-[180px]" />
                                    </div>
                                    <button 
                                        onClick={downloadQr}
                                        className="w-full font-bold inline-flex justify-center items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 h-10 px-4 py-2 rounded-lg text-sm transition-colors mt-2"
                                    >
                                        <Download className="w-4 h-4" /> TẢI MÃ XUỐNG
                                    </button>
                                </div>
                            ) : (
                                <div className="p-8"><RefreshCw className="w-6 h-6 animate-spin text-pink-300" /></div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right content: List */}
                <div className="xl:w-3/4 w-full bg-white rounded-2xl border overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-gray-500" /> Danh sách Vé
                        </h2>
                        <button onClick={fetchCodes} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* THE HEAD */}
                            <div className={`${gridLayout} text-[13px] text-pink-400 px-6 py-3 border-b font-bold uppercase text-center`}>
                                <span className="text-left">Mã Code</span>
                                <span>Trạng Thái</span>
                                <span>Ngày Tạo</span>
                                <span>Kích Hoạt</span>
                                <span>Hạn Dùng</span>
                                <span className="text-right">Action</span>
                            </div>

                            {/* LOAD / EMPTY */}
                            {loading && codes.length === 0 && (
                                <div className="p-10 text-center text-gray-400">Đang tải...</div>
                            )}
                            {!loading && codes.length === 0 && (
                                <div className="p-10 text-center text-gray-400">Chưa có mã truy cập nào...</div>
                            )}

                            {/* LIST */}
                            {codes.length > 0 && codes.map(c => {
                                const isUsed = !!c.usedByDeviceId;
                                const isExpired = c.expireAt && new Date(c.expireAt) < new Date();
                                return (
                                    <div
                                        key={c.codeId}
                                        className={`${gridLayout} items-center px-6 py-4 border-b hover:bg-gray-50 transition-colors bg-white`}
                                    >
                                        {/* CODE */}
                                        <div className="text-left font-mono font-bold text-gray-800 text-sm">
                                            {c.code}
                                        </div>
                                        
                                        {/* STATUS */}
                                        <div className="text-center flex justify-center text-sm">
                                            {isUsed ? (
                                                isExpired ? (
                                                    <div className="inline-flex items-center text-red-500 font-medium">
                                                        <XCircle className="w-4 h-4 mr-1" /> Hết hạn
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <div className="inline-flex items-center text-green-500 font-medium">
                                                            <CheckCircle2 className="w-4 h-4 mr-1" /> Đã dùng
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 max-w-[120px] truncate mt-0.5" title={c.usedByDeviceId}>
                                                            {c.usedByDeviceId}
                                                        </span>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="inline-flex items-center text-gray-400 font-medium">
                                                    <Clock className="w-4 h-4 mr-1" /> Chưa dùng
                                                </div>
                                            )}
                                        </div>

                                        {/* CREATED AT */}
                                        <div className="text-center text-sm text-gray-500">
                                            {c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "-"}
                                        </div>

                                        {/* ACTIVATED AT */}
                                        <div className="text-center text-sm text-gray-500">
                                            {c.activatedAt ? format(new Date(c.activatedAt), "dd/MM/yyyy") : "-"}
                                        </div>

                                        {/* EXPIRE AT */}
                                        <div className="text-center text-sm text-gray-500">
                                            {c.expireAt ? format(new Date(c.expireAt), "dd/MM/yyyy") : "-"}
                                        </div>

                                        {/* ACTION */}
                                        <div className="flex justify-end items-center gap-2">
                                            <button 
                                                onClick={() => handleShowQr(c.code)}
                                                className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-pink-50 hover:text-pink-500 transition-colors whitespace-nowrap"
                                            >
                                                Xem QR
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleDelete(c.codeId)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-shrink-0"
                                                title="Xóa mã"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 0 && (
                        <div className="flex justify-between px-6 py-4 text-sm text-gray-500 items-center bg-gray-50/50">
                            <p>
                                Hiển thị trang <span className="font-bold text-gray-800">{page}</span> / <span className="font-bold">{totalPages}</span>
                            </p>

                            <div className="flex gap-1 items-center">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className={`p-2 rounded-full ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition"}`}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(i => i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1))
                                    .reduce((acc, curr, idx, arr) => {
                                        if (idx > 0 && curr - arr[idx - 1] > 1) acc.push('...');
                                        acc.push(curr);
                                        return acc;
                                    }, [])
                                    .map((p, idx) => (
                                        p === '...' ? (
                                            <span key={`dots-${idx}`} className="px-2 text-gray-400">...</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-pink-500 text-white shadow-sm" : "hover:bg-pink-50 hover:text-pink-600"}`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    ))}

                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className={`p-2 rounded-full ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition"}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
