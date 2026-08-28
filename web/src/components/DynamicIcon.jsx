import {
  MapPin, Globe, Heart, Star, Users, Music, Headphones, Smartphone,
  Mic, Volume2, PlayCircle, Utensils, Coffee, ChefHat, Leaf, Flame,
  Award, BadgeCheck, ShieldCheck, Zap, Sparkles, Layers, Route,
  Navigation, Clock, CheckCircle, ThumbsUp, MessageCircle, Download,
  QrCode, Check, Loader2, Phone, Store, User, MessageSquare, Compass,
  Radio, Bookmark, Share2, Shield, Activity, TrendingUp,
  CreditCard, Bell, Settings, Search, Filter, Calendar, Camera, Info,
  HelpCircle, Lock, Unlock, Wifi, FileText, Eye, Trash2, Edit, Plus,
  X, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ArrowRight,
  ExternalLink, RefreshCw
} from "lucide-react";

const ICON_MAP = {
  MapPin, Globe, Heart, Star, Users, Music, Headphones, Smartphone,
  Mic, Volume2, PlayCircle, Utensils, Coffee, ChefHat, Leaf, Flame,
  Award, BadgeCheck, ShieldCheck, Zap, Sparkles, Layers, Route,
  Navigation, Clock, CheckCircle, ThumbsUp, MessageCircle, Download,
  QrCode, Check, Loader2, Phone, Store, User, MessageSquare, Compass,
  Radio, Bookmark, Share2, Shield, Activity, TrendingUp,
  CreditCard, Bell, Settings, Search, Filter, Calendar, Camera, Info,
  HelpCircle, Lock, Unlock, Wifi, FileText, Eye, Trash2, Edit, Plus,
  X, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ArrowRight,
  ExternalLink, RefreshCw
};

export default function DynamicIcon({ name, fallback = Sparkles, ...props }) {
  const IconComponent = (name && ICON_MAP[name]) || fallback;
  return <IconComponent {...props} />;
}
