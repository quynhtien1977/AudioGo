import { useState, useEffect } from "react";
import { Headphones, Play, Pause, RefreshCw, Search, ChevronDown, ChevronUp, Languages, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { audioContentApi } from "../api/audioContentApi";

export default function AudioContentPage() {
    const [audioContents, setAudioContents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [playingId, setPlayingId] = useState(null);
    const [audioElement, setAudioElement] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});

    useEffect(() => {
        fetchContents();
        // Cleanup audio on unmount
        return () => {
            if (audioElement) {
                audioElement.pause();
            }
        };
    }, [page]);

    const fetchContents = async () => {
        setLoading(true);
        try {
            const res = await audioContentApi.getAllTranslations(page, 5);
            if (res.data && res.data.data) {
                setAudioContents(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch audio contents:", error);
        } finally {
            setLoading(false);
        }
    };

    const togglePlay = (id, url) => {
        if (playingId === id) {
            if (audioElement) {
                if (audioElement.paused) {
                    audioElement.play();
                } else {
                    audioElement.pause();
                }
            }
            return;
        }

        if (audioElement) {
            audioElement.pause();
        }

        if (!url) return;

        const newAudio = new Audio(url);
        newAudio.play();
        setAudioElement(newAudio);
        setPlayingId(id);

        newAudio.onended = () => {
            setPlayingId(null);
            setAudioElement(null);
        };
    };

    const toggleExpand = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const isItemPlaying = (id) => playingId === id && audioElement && !audioElement.paused;

    const renderAudioButton = (id, url) => {
        const isPlaying = isItemPlaying(id);
        return (
            <div className="flex justify-center items-center w-full">
                {url ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg w-fit">
                        <button 
                            onClick={() => togglePlay(id, url)}
                            className={`p-1.5 rounded-full flex-shrink-0 ${isPlaying ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-all`}
                        >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-xs text-gray-500 truncate w-24 text-left" title={url}>
                            {isPlaying ? "Đang phát..." : "Nghe thử"}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded border border-gray-100 border-dashed">Chưa có File</span>
                )}
            </div>
        );
    }

    const gridLayout = "grid grid-cols-[1.5fr_1fr_2.5fr_1.5fr_1fr_1fr] lg:grid-cols-[1.5fr_1fr_3.5fr_1.5fr_1fr_1fr]";

    return (
        <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase">
                        Quản lý Âm thanh & Bản Dịch
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Danh sách các kịch bản và tệp âm thanh đính kèm từng Địa điểm (POI).
                    </p>
                </div>
                <button onClick={fetchContents} className="p-2 hover:bg-white rounded-full bg-gray-50 text-gray-500 border transition flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại
                </button>
            </div>

            <div className="w-full bg-white rounded-2xl border overflow-hidden shadow-sm">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-gray-500" /> Bản ghi gốc ({audioContents.length})
                    </h2>
                </div>

                <div className="w-full overflow-x-auto">
                    <div className="min-w-[1000px]">
                        {/* HEADER ROW */}
                        <div className={`${gridLayout} text-[13px] text-pink-400 px-6 py-3 border-b font-bold uppercase text-center bg-gray-50/50`}>
                            <span className="text-left">Tên Địa Điểm</span>
                            <span>Ngôn ngữ gốc</span>
                            <span className="text-left">Mô tả</span>
                            <span>Âm thanh</span>
                            <span>Ngày tạo</span>
                            <span>Hành động</span>
                        </div>

                        {/* LOAD / EMPTY */}
                        {loading && audioContents.length === 0 && (
                            <div className="p-10 text-center text-gray-400">Đang tải dữ liệu...</div>
                        )}
                        {!loading && audioContents.length === 0 && (
                            <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                                <Search className="w-10 h-10 text-gray-200 mb-2" />
                                Chưa có nội dung âm thanh nào.
                            </div>
                        )}

                        {/* LIST */}
                        {audioContents.length > 0 && audioContents.map(c => {
                            const isExpanded = expandedRows[c.contentId];
                            return (
                                <div key={c.contentId} className="flex flex-col">
                                    <div className={`${gridLayout} items-center px-6 py-4 border-b hover:bg-gray-50 transition-colors bg-white font-medium`}>
                                        {/* POI NAME */}
                                        <div className="text-left text-sm text-gray-800 break-words flex items-center gap-2 font-bold">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 shadow-sm" />
                                            {c.poiName}
                                        </div>
                                        
                                        {/* LANGUAGE CODE */}
                                        <div className="text-center text-sm flex items-center justify-center gap-1.5">
                                            <Languages className="w-4 h-4 text-gray-400"/>
                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-xs font-bold font-mono">
                                                {c.languageCode || 'vi-VN'}
                                            </span>
                                        </div>

                                        {/* DESCRIPTION */}
                                        <div className="text-left text-sm text-gray-600 font-normal line-clamp-2" title={c.description}>
                                            {c.description || "-"}
                                        </div>

                                        {/* AUDIO */}
                                        {renderAudioButton(c.contentId, c.audioUrl)}

                                        {/* CREATED AT */}
                                        <div className="text-center text-xs text-gray-500 font-normal">
                                            {c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "-"}
                                        </div>

                                        {/* ACTION (EXPAND) */}
                                        <div className="text-center text-sm flex justify-center">
                                            {c.translations && c.translations.length > 0 ? (
                                                <button 
                                                    onClick={() => toggleExpand(c.contentId)}
                                                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition"
                                                >
                                                    {c.translations.length} Bản dịch 
                                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">0 Bản dịch</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* EXPANDED SECTION */}
                                    {isExpanded && c.translations && (
                                        <div className="bg-gray-50/50 border-b p-4 shadow-inner">
                                            <div className="ml-[12%] lg:ml-[10%] border-l-2 border-pink-200 pl-6 space-y-3 relative">
                                                {c.translations.map(t => (
                                                    <div key={t.contentId} className="grid grid-cols-[1fr_3.5fr_1.5fr] items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative pl-6">
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-[25px] w-6 h-[2px] bg-pink-200"></div>
                                                        
                                                        {/* TRANSLATION LANG */}
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-bold font-mono inline-flex items-center gap-1">
                                                                <Languages className="w-3 h-3 text-gray-400"/>
                                                                {t.languageCode}
                                                            </span>
                                                            <span className="text-xs text-gray-400 mt-1">
                                                                {t.createdAt ? format(new Date(t.createdAt), "dd/MM/yyyy") : "-"}
                                                            </span>
                                                        </div>

                                                        {/* TRANSLATION DESC */}
                                                        <div className="text-[13px] text-gray-600 font-normal line-clamp-3 leading-relaxed" title={t.description}>
                                                            {t.description || "-"}
                                                        </div>

                                                        {/* TRANSLATION AUDIO */}
                                                        <div className="flex justify-end pr-2">
                                                            {renderAudioButton(t.contentId, t.audioUrl)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PAGINATION */}
                {totalPages > 0 && (
                    <div className="flex justify-between px-6 py-4 text-sm text-gray-500 items-center bg-gray-50/50 border-t">
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
    );
}
