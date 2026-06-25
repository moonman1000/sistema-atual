import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pizza, Loader2, Terminal } from "lucide-react"; // Importar Terminal para fallback
import * as LucideIcons from "lucide-react"; // Importar todos os ícones Lucide
import { useSession } from "@/context/SessionContext";
import { useRestaurant } from "@/context/RestaurantContext";
import { toast } from "sonner";
import { uploadImageToSupabase } from "@/integrations/supabase/storage"; // Importar função de upload
import { slugify } from "@/lib/utils"; // Importar slugify
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Importar Alert
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // NOVO: Importar Select

// Lista de ícones disponíveis para seleção (a maioria dos ícones Lucide)
const availableIcons = [
  "Activity", "Airplay", "AlarmClock", "AlignCenter", "AlignJustify", "AlignLeft", "AlignRight",
  "Anchor", "Annoyed", "Archive", "ArrowBigDownDash", "ArrowBigDown", "ArrowBigLeftDash", "ArrowBigLeft",
  "ArrowBigRightDash", "ArrowBigRight", "ArrowBigUpDash", "ArrowBigUp", "ArrowDown01", "ArrowDown10",
  "ArrowDownAZ", "ArrowDownCircle", "ArrowDownFromLine", "ArrowDownLeft", "ArrowDownRight", "ArrowDownSquare",
  "ArrowDownToDot", "ArrowDownToLine", "ArrowDownUp", "ArrowDownWide", "ArrowDown", "ArrowLeftCircle",
  "ArrowLeftFromLine", "ArrowLeftRight", "ArrowLeftSquare", "ArrowLeftToLine", "ArrowLeft", "ArrowRightCircle",
  "ArrowRightFromLine", "ArrowRightLeft", "ArrowRightSquare", "ArrowRightToLine", "ArrowRight", "ArrowUp01",
  "ArrowUp10", "ArrowUpAZ", "ArrowUpCircle", "ArrowUpFromDot", "ArrowUpFromLine", "ArrowUpLeft", "ArrowUpRight",
  "ArrowUpSquare", "ArrowUpToLine", "ArrowUpWide", "ArrowUp", "Asterisk", "AtSign", "Atom", "Award", "Baby",
  "Backpack", "BadgeAlert", "BadgeCent", "BadgeCheck", "BadgeDollar", "BadgeEuro", "BadgeHelp", "BadgeIndianRupee",
  "BadgeInfo", "BadgeJapaneseYen", "BadgeMinus", "BadgePercent", "BadgePlus", "BadgePoundSterling", "BadgeQuestion",
  "BadgeRussianRuble", "BadgeSwissFranc", "BadgeX", "Badge", "BaggageClaim", "Ban", "Banana", "Banknote", "BarChart2",
  "BarChart3", "BarChart4", "BarChartBig", "BarChartHorizontalBig", "BarChartHorizontal", "BarChart", "Baseline",
  "Bath", "BatteryCharging", "BatteryFull", "BatteryLow", "BatteryMedium", "BatteryWarning", "Battery", "Beaker",
  "BeanOff", "Bean", "BedDouble", "BedSingle", "Bed", "Beef", "Beer", "BellDot", "BellElectric", "BellMinus",
  "BellOff", "BellPlus", "BellRing", "Bell", "Bike", "Binary", "Bird", "Bitcoin", "Blinds", "Blocks", "BluetoothConnected",
  "BluetoothOff", "BluetoothSearching", "Bluetooth", "Bold", "Bomb", "Bone", "BookA", "BookCheck", "BookCopy", "BookDashed",
  "BookDown", "BookHeadphones", "BookHeart", "BookImage", "BookKey", "BookLock", "BookMarked", "BookMinus", "BookOpenCheck",
  "BookOpen", "BookPlus", "BookQuestion", "BookText", "BookType", "BookUp", "BookUser", "BookX", "Book", "BookmarkCheck",
  "BookmarkMinus", "BookmarkPlus", "Bookmark", "Bot", "BoxSelect", "Box", "Boxes", "Braces", "Brackets", "Brain", "Briefcase",
  "Brush", "Bug", "Building2", "Building", "Bus", "Bussiness", "Buy", "CableCar", "Cake", "Calculator", "CalendarCheck2",
  "CalendarCheck", "CalendarClock", "CalendarDays", "CalendarHeart", "CalendarMinus", "CalendarOff", "CalendarPlus",
  "CalendarRange", "CalendarSearch", "CalendarX2", "CalendarX", "Calendar", "CameraOff", "Camera", "CandlestickChart",
  "CandyCane", "CandyOff", "Candy", "Car", "Carrot", "CaseLower", "CaseUpper", "Cast", "Cat", "CheckCheck", "CheckCircle2",
  "CheckCircle", "CheckSquare", "Check", "ChefHat", "Cherry", "ChevronDown", "ChevronFirst", "ChevronLast", "ChevronLeft",
  "ChevronRight", "ChevronUp", "Chrome", "Church", "CigaretteOff", "Cigarette", "CircleDashed", "CircleDollarSign",
  "CircleDotDashed", "CircleDot", "CircleEllipsis", "CircleEqual", "CircleOff", "CircleSlash2", "CircleSlash", "CircleStack",
  "CircleUserRound", "CircleUser", "CircleX", "Circle", "CircuitBoard", "Citrus", "Clapperboard", "ClipboardCheck",
  "ClipboardCopy", "ClipboardList", "ClipboardMinus", "ClipboardPaste", "ClipboardPenLine", "ClipboardPen", "ClipboardPlus",
  "ClipboardType", "ClipboardX", "Clipboard", "Clock1", "Clock10", "Clock11", "Clock12", "Clock2", "Clock3", "Clock4",
  "Clock5", "Clock6", "Clock7", "Clock8", "Clock9", "Clock", "CloudCog", "CloudDashed", "CloudDownload", "CloudFog",
  "CloudHail", "CloudLightning", "CloudMoon", "CloudOff", "CloudRain", "CloudSnow", "CloudSun", "CloudUpload", "Cloud",
  "Code2", "Code", "Codepen", "Codesandbox", "Coffee", "Cog", "Coins", "Columns", "Combine", "Command", "Compass",
  "Component", "ConciergeBell", "Construction", "Contact2", "Contact", "Container", "Contrast", "Cookie", "CopyCheck",
  "CopyMinus", "CopyPlus", "CopySlash", "CopyX", "Copy", "CornerDownLeft", "CornerDownRight", "CornerLeftDown",
  "CornerLeftUp", "CornerRightDown", "CornerRightUp", "CornerUpLeft", "CornerUpRight", "Cpu", "CreditCard", "Crop",
  "Cross", "Crosshair", "Crown", "Cuboid", "CupSoda", "Currency", "Database", "Delete", "Dices", "Diff", "Disc2",
  "Disc3", "Disc", "Divide", "Dna", "Dog", "DollarSign", "DoorClosed", "DoorOpen", "Dot", "DownloadCloud", "Download",
  "Dribbble", "Droplet", "Droplets", "Drumstick", "Dumbbell", "EarOff", "Ear", "Edit2", "Edit3", "Edit", "EggFried",
  "Egg", "EqualNot", "Equal", "Eraser", "Euro", "Expand", "ExternalLink", "EyeOff", "Eye", "Facebook", "Factory",
  "Fan", "FastForward", "Feather", "Figma", "FileArchive", "FileAudio", "FileAxis3d", "FileBadge2", "FileBadge",
  "FileBarChart2", "FileBarChart", "FileBox", "FileCheck2", "FileCheck", "FileClock", "FileCode", "FileCog",
  "FileDiff", "FileDigit", "FileDown", "FileEdit", "FileHeart", "FileImage", "FileInput", "FileJson", "FileKey",
  "FileLock", "FileMinus2", "FileMinus", "FileOutput", "FilePenLine", "FilePen", "FilePlus2", "FilePlus",
  "FileQuestion", "FileScan", "FileSearch", "FileSliders", "FileSpreadsheet", "FileStack", "FileSymlink",
  "FileTerminal", "FileText", "FileType2", "FileType", "FileUp", "FileVideo", "FileVolume", "FileWarning",
  "FileX2", "FileX", "File", "Files", "Film", "Filter", "Fingerprint", "FlagOff", "FlagTriangleLeft",
  "FlagTriangleRight", "Flag", "Flame", "FlashlightOff", "Flashlight", "FlaskConical", "FlaskRound", "FlipHorizontal",
  "FlipVertical", "Flower2", "Flower", "Focus", "FoldHorizontal", "FoldVertical", "FolderArchive", "FolderCheck",
  "FolderClock", "FolderClosed", "FolderCog", "FolderDot", "FolderDown", "FolderEdit", "FolderGit2", "FolderGit",
  "FolderHeart", "FolderInput", "FolderKanban", "FolderKey", "FolderLock", "FolderMinus", "FolderOpenDot",
  "FolderOpen", "FolderOutput", "FolderPen", "FolderPlus", "FolderRoot", "FolderSearch2", "FolderSearch",
  "FolderSymlink", "FolderSync", "FolderTree", "FolderUp", "FolderX", "Folder", "Folders", "Footprints", "Forklift",
  "FormInput", "Forward", "Frame", "Framer", "Frown", "Fuel", "FunctionSquare", "GalleryHorizontalEnd",
  "GalleryHorizontal", "GalleryVerticalEnd", "GalleryVertical", "Gamepad2", "Gamepad", "GanttChart", "Gauge",
  "Gavel", "Gem", "Ghost", "Gift", "GitBranchPlus", "GitBranch", "GitCommit", "GitCompare", "GitFork",
  "GitGraph", "GitMerge", "GitPullRequestClosed", "GitPullRequestDraft", "GitPullRequest", "Github", "Gitlab",
  "GlassWater", "Glasses", "Globe", "Goal", "Grab", "GraduationCap", "Grape", "Grid2x2", "Grid3x3", "GripHorizontal",
  "GripVertical", "Grip", "Group", "Hammer", "HandMetal", "Hand", "HardDriveDownload", "HardDriveUpload", "HardDrive",
  "HardHat", "Hash", "Haze", "HdmiPort", "Heading1", "Heading2", "Heading3", "Heading4", "Heading5", "Heading6",
  "Heading", "Headphones", "Headset", "HeartCrack", "HeartHandshake", "HeartOff", "HeartPulse", "Heart", "HelpCircle",
  "HelpingHand", "Hexagon", "Highlighter", "History", "Home", "HopOff", "Hop", "Hospital", "Hotel", "Hourglass",
  "Html5", "HttpHand", "IceCream", "IceSkate", "ImageDown", "ImageMinus", "ImageOff", "ImagePlus", "Image", "Images",
  "Import", "Inbox", "Indent", "IndianRupee", "Infinity", "Info", "InspectionPanel", "Instagram", "Italic", "JapaneseYen",
  "Joystick", "Kanban", "Key", "Keyboard", "Keyring", "LampCeiling", "LampDesk", "LampFloor", "LampWallDown",
  "LampWallUp", "Landmark", "Languages", "Laptop", "LassoSelect", "Lasso", "Laugh", "Layers", "LayoutDashboard",
  "LayoutGrid", "LayoutList", "LayoutPanelLeft", "LayoutPanelTop", "LayoutTemplate", "Layout", "Leaf", "LifeBuoy",
  "LightbulbOff", "Lightbulb", "LineChart", "Link2Off", "Link2", "Link", "Linkedin", "ListChecks", "ListEnd",
  "ListFilter", "ListMinus", "ListMusic", "ListOrdered", "ListPlus", "ListRestart", "ListStart", "ListTodo",
  "ListVideo", "ListX", "List", "Loader2", "Loader", "LocateFixed", "LocateOff", "Locate", "Lock", "LogIn",
  "LogOut", "Lollipop", "Luggage", "Mails", "MapPin", "Map", "Maximize2", "Maximize", "Medal", "MegaphoneOff",
  "Megaphone", "Meh", "Menu", "MessageCircleCode", "MessageCircleDashed", "MessageCircleHeart", "MessageCircleOff",
  "MessageCirclePlus", "MessageCircleQuestion", "MessageCircleReply", "MessageCircleX", "MessageCircle", "MessageSquareCode",
  "MessageSquareDashed", "MessageSquareDiff", "MessageSquareDot", "MessageSquareHeart", "MessageSquareOff",
  "MessageSquarePlus", "MessageSquareQuote", "MessageSquareReply", "MessageSquareShare", "MessageSquareText",
  "MessageSquareX", "MessageSquare", "MessagesSquare", "Mic2", "MicOff", "Mic", "Minimize2", "Minimize", "MinusCircle",
  "MinusSquare", "Minus", "MonitorCheck", "MonitorDot", "MonitorDown", "MonitorOff", "MonitorPause", "MonitorPlay",
  "MonitorSmartphone", "MonitorSpeaker", "MonitorUp", "MonitorX", "Monitor", "Moon", "MoreHorizontal", "MoreVertical",
  "MountainSnow", "Mountain", "MousePointer2", "MousePointerClick", "MousePointer", "Mouse", "Move3d", "MoveHorizontal",
  "MoveVertical", "Move", "Music2", "Music3", "Music4", "Music", "Navigation2Off", "Navigation2", "Navigation",
  "Network", "Newspaper", "Nfc", "NutOff", "Nut", "Octagon", "Package2", "PackageCheck", "PackageMinus", "PackageOpen",
  "PackagePlus", "PackageSearch", "PackageX", "Package", "PaintBucket", "Paintbrush2", "Paintbrush", "Palette",
  "PanelBottomClose", "PanelBottomOpen", "PanelBottom", "PanelLeftClose", "PanelLeftOpen", "PanelLeft",
  "PanelRightClose", "PanelRightOpen", "PanelRight", "PanelTopClose", "PanelTopOpen", "PanelTop", "Paperclip",
  "Parentheses", "ParkingMeter", "PartyPopper", "PauseCircle", "PauseOctagon", "PawPrint", "PcCase", "PenTool",
  "PencilLine", "PencilOff", "PencilRuler", "Pencil", "Percent", "PersonStanding", "PhoneCall", "PhoneForwarded",
  "PhoneIncoming", "PhoneMissed", "PhoneOff", "PhoneOutgoing", "PhonePaused", "Phone", "PictureInPicture2",
  "PictureInPicture", "PieChart", "PiggyBank", "Pill", "Pin", "PinOff", "Pipette", "Pizza", "Plane", "PlayCircle",
  "Play", "Plug2", "PlugZap", "Plug", "PlusCircle", "PlusSquare", "Plus", "Pocket", "Podcast", "Pointer", "PoundSterling",
  "PowerOff", "Power", "Printer", "QrCode", "Quote", "RadioReceiver", "Radio", "RectangleHorizontal", "RectangleVertical",
  "Recycle", "Redo2", "RedoDot", "Redo", "RefreshCcw", "RefreshCw", "Regex", "RemoveFormatting", "Repeat01", "Repeat1",
  "Repeat2", "Repeat", "ReplaceAll", "Replace", "ReplyAll", "Reply", "Rewind", "Ribbon", "Rocket", "RockingChair",
  "RollerCoaster", "Rotate3d", "RotateCcw", "RotateCw", "Route", "Router", "Rows3", "Rss", "Ruler", "RussianRuble",
  "Sailboat", "Salad", "Sandwich", "SatelliteDish", "Satellite", "SaveAll", "Save", "Scale3d", "Scale", "ScanBarcode",
  "ScanEye", "ScanFace", "ScanLine", "ScanQr", "ScanText", "Scan", "Scissors", "ScreenShareOff", "ScreenShare",
  "ScrollText", "Scroll", "Search", "Send", "SeparatorHorizontal", "SeparatorVertical", "ServerCog", "ServerCrash",
  "ServerOff", "Server", "Settings2", "Settings", "Share2", "Share", "Sheet", "ShieldAlert", "ShieldCheck",
  "ShieldClose", "ShieldOff", "ShieldQuestion", "Shield", "Ship", "ShoppingBag", "ShoppingCart", "Shovel", "ShowerHead",
  "Shrink", "Shrub", "Shuffle", "SidebarClose", "SidebarOpen", "Sidebar", "Sigma", "SignalHigh", "SignalLow",
  "SignalMedium", "SignalOff", "SignalZero", "Signal", "Siren", "SkipBack", "SkipForward", "Skull", "Slack", "Slash",
  "Slice", "SlidersHorizontal", "Sliders", "SmartphoneCharging", "SmartphoneNfc", "Smartphone", "Smile", "Snowflake",
  "Sofa", "SortAsc", "SortDesc", "Speaker", "Speech", "SplitSquareHorizontal", "SplitSquareVertical", "Split",
  "Sprout", "SquareAsterisk", "SquareDot", "SquareEqual", "SquareOff", "SquareStack", "SquareTerminal", "SquareUserRound",
  "SquareUser", "SquareX", "Square", "Squirrel", "StarHalf", "StarOff", "Star", "Stars", "StickyNote", "Store",
  "StretchHorizontal", "StretchVertical", "Strikethrough", "Subscript", "SunDim", "SunMedium", "SunSnow", "Sun",
  "Sunrise", "Sunset", "Superscript", "SwatchBook", "SwissFranc", "SwitchCamera", "Sword", "Swords", "Syringe",
  "Table2", "TableProperties", "Table", "Tablet", "Tag", "Tags", "Target", "Tent", "Terminal", "TestTube2", "TestTube",
  "TestTubes", "TextCursorInput", "TextCursor", "TextQuote", "TextSelect", "TextSize", "Text", "ThermometerSnowflake",
  "ThermometerSun", "Thermometer", "ThumbsDown", "ThumbsUp", "Ticket", "TimerOff", "TimerReset", "Timer", "ToggleLeft",
  "ToggleRight", "Tornado", "ToyBrick", "TrainFrontTunnel", "TrainFront", "TrainTrack", "Train", "Tram", "Trash2",
  "Trash", "TreeDeciduous", "TreePine", "Trees", "Trello", "TrendingDown", "TrendingUp", "Triangle", "Truck", "Tv",
  "Twitch", "Twitter", "Type", "Umbrella", "Underline", "Undo2", "UndoDot", "Undo", "UnfoldHorizontal", "UnfoldVertical",
  "Ungroup", "Unlink2", "Unlink", "Unlock", "UploadCloud", "Upload", "Usb", "User2", "UserCheck2", "UserCheck",
  "UserCircle2", "UserCircle", "UserCog2", "UserCog", "UserMinus2", "UserMinus", "UserPlus2", "UserPlus", "UserRoundCheck",
  "UserRoundMinus", "UserRoundPlus", "UserRoundX", "UserRound", "UserX2", "UserX", "User", "Users2", "UsersRound",
  "Users", "UtensilsCrossed", "Utensils", "Vegan", "VenetianMask", "Verified", "VibrateOff", "Vibrate", "VideoOff",
  "Video", "View", "Voicemail", "Volume1", "Volume2", "VolumeX", "Volume", "Wallet2", "WalletCards", "Wallet", "Wand2",
  "Wand", "Warehouse", "Watch", "Waves", "Webcam", "Webhook", "Weight", "WheatOff", "Wheat", "WholeWord", "WifiOff",
  "Wifi", "Wind", "WineOff", "Wine", "Workflow", "WrapText", "Wrench", "XCircle", "XOctagon", "XSquare", "X", "Youtube",
  "ZapOff", "Zap", "ZoomIn", "ZoomOut",
];

// NOVO: Função para obter valores padrão com base no tipo de estabelecimento
const getDefaultsForType = (type: "restaurant" | "cafe" | "bar" | "other" | "pharmacy" | "market" | "petshop" | "service") => {
  switch (type) {
    case "restaurant":
      return {
        appName: "Pizza Manager",
        adminHeaderTitle: "PizzaApp Admin",
        appIcon: "Pizza",
        namePlaceholder: "Ex: Pizza Palace",
        descriptionPlaceholder: "A melhor pizzaria da cidade!",
      };
    case "pharmacy":
      return {
        appName: "Farmácia Manager",
        adminHeaderTitle: "Farmácia Admin",
        appIcon: "Pill",
        namePlaceholder: "Ex: Drogaria Central",
        descriptionPlaceholder: "Sua farmácia de confiança para saúde e bem-estar.",
      };
    case "market":
      return {
        appName: "Mercado Manager",
        adminHeaderTitle: "Mercado Admin",
        appIcon: "Store",
        namePlaceholder: "Ex: Mercado Bom Preço",
        descriptionPlaceholder: "Seu mercado de confiança para produtos de qualidade.",
      };
    case "petshop":
      return {
        appName: "Petshop Manager",
        adminHeaderTitle: "Petshop Admin",
        appIcon: "PawPrint",
        namePlaceholder: "Ex: Pet Feliz",
        descriptionPlaceholder: "Tudo para o seu pet, com carinho e qualidade.",
      };
    case "service":
      return {
        appName: "Serviços Manager",
        adminHeaderTitle: "Serviços Admin",
        appIcon: "Briefcase",
        namePlaceholder: "Ex: Lava Rápido Express",
        descriptionPlaceholder: "Provedor de serviços de alta qualidade para suas necessidades.",
      };
    case "cafe":
      return {
        appName: "Café Manager",
        adminHeaderTitle: "Café Admin",
        appIcon: "Coffee",
        namePlaceholder: "Ex: Café com Leite",
        descriptionPlaceholder: "O melhor café da cidade para começar seu dia.",
      };
    case "bar":
      return {
        appName: "Bar Manager",
        adminHeaderTitle: "Bar Admin",
        appIcon: "Beer",
        namePlaceholder: "Ex: Bar do Zé",
        descriptionPlaceholder: "Onde a cerveja está sempre gelada e a conversa rola solta.",
      };
    default:
      return {
        appName: "App Manager",
        adminHeaderTitle: "Admin Panel",
        appIcon: "Terminal",
        namePlaceholder: "Ex: Meu Estabelecimento",
        descriptionPlaceholder: "Gerencie seu negócio com facilidade.",
      };
  }
};


const CreateRestaurantPage = () => {
  const { session, user, profile, isLoading: isLoadingSession, isAdmin, isSuperAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants, createRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const [name, setName] = useState(""); // Começa vazio para o placeholder dinâmico
  const [description, setDescription] = useState(""); // Começa vazio para o placeholder dinâmico
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [isCreating, setIsCreating] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null); // Estado para o arquivo do logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null); // Estado para a prévia do logo
  const [restaurantType, setRestaurantType] = useState<"restaurant" | "cafe" | "bar" | "other" | "pharmacy" | "market" | "petshop" | "service">("restaurant"); // NOVO: Estado para o tipo de restaurante

  const [logoFileInputKey, setLogoFileInputKey] = useState(Date.now()); // NOVO: Estado para a chave do input de arquivo
  const [iconSearch, setIconSearch] = React.useState("");
  const [filteredIcons, setFilteredIcons] = React.useState(availableIcons);

  // NOVO: Estados para os valores dinâmicos do tipo de restaurante
  const [dynamicAppName, setDynamicAppName] = useState("Pizza Manager");
  const [dynamicAdminHeaderTitle, setDynamicAdminHeaderTitle] = useState("PizzaApp Admin");
  const [dynamicAppIcon, setDynamicAppIcon] = useState("Pizza");
  const [dynamicNamePlaceholder, setDynamicNamePlaceholder] = useState("Ex: Pizza Palace");
  const [dynamicDescriptionPlaceholder, setDynamicDescriptionPlaceholder] = useState("A melhor pizzaria da cidade!");

  // NOVO: Definição de AppIconComponent aqui, usando dynamicAppIcon
  const AppIconComponent = (LucideIcons as any)[dynamicAppIcon] || Terminal;

  useEffect(() => {
    if (!isLoadingSession) {
      if (!session) {
        navigate("/login");
        toast.info("Você precisa estar logado para criar um restaurante.");
      } else if (!isLoadingSession && session && !isAdmin && !isSuperAdmin) { // ATUALIZADO: Incluir isSuperAdmin
        navigate("/profile"); // Redireciona clientes para o perfil
        toast.error("Acesso negado. Apenas administradores ou super administradores podem criar restaurantes.");
      } else if (!isLoadingSession && !isLoadingRestaurants && currentRestaurant) {
        // Se o admin ou super_admin já tem um restaurante, redireciona para o dashboard
        navigate("/admin/dashboard");
      }
    }
  }, [isLoadingSession, session, isAdmin, isSuperAdmin, isLoadingRestaurants, currentRestaurant, navigate, user]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // NOVO: Efeito para atualizar os valores dinâmicos quando o tipo de restaurante muda
  useEffect(() => {
    const defaults = getDefaultsForType(restaurantType);
    setDynamicAppName(defaults.appName);
    setDynamicAdminHeaderTitle(defaults.adminHeaderTitle);
    setDynamicAppIcon(defaults.appIcon);
    setDynamicNamePlaceholder(defaults.namePlaceholder);
    setDynamicDescriptionPlaceholder(defaults.descriptionPlaceholder);
    // Não atualiza o estado `appIcon` diretamente aqui, pois `dynamicAppIcon` já está sendo usado
    // e será atualizado via `setDynamicAppIcon`.
  }, [restaurantType]);


  // Efeito para gerenciar a prévia do logo
  useEffect(() => {
    console.log("[CreateRestaurantPage] Logo useEffect triggered. logoFile:", logoFile ? logoFile.name : "null", "logoPreview:", logoPreview);
    if (logoFile) {
      const newUrl = URL.createObjectURL(logoFile);
      console.log("[CreateRestaurantPage] Logo useEffect - new local URL created:", newUrl);
      setLogoPreview(newUrl);
      return () => {
        console.log("[CreateRestaurantPage] Logo useEffect cleanup - revoking URL:", newUrl);
        URL.revokeObjectURL(newUrl);
      };
    } else {
      if (logoPreview) {
        console.log("[CreateRestaurantPage] Logo useEffect cleanup - revoking old local URL:", logoPreview);
        URL.revokeObjectURL(logoPreview);
      }
      setLogoPreview(null);
    }
  }, [logoFile]);

  // Effect para resetar logoFileInputKey quando isCreating muda
  useEffect(() => {
    console.log("[CreateRestaurantPage] logoFileInputKey useEffect triggered. isCreating:", isCreating);
    setLogoFileInputKey(Date.now());
  }, [isCreating]);

  // Effect para filtrar ícones
  React.useEffect(() => {
    setFilteredIcons(
      availableIcons.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase()))
    );
  }, [iconSearch]);

  const IconPreview: React.FC<{ iconName: string }> = ({ iconName }) => {
    const IconComponent = (LucideIcons as any)[iconName] || Terminal;
    return IconComponent ? <IconComponent className="h-5 w-5 text-primary" /> : <Terminal className="h-5 w-5 text-destructive" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !phone || !email) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsCreating(true);
    let finalLogoUrl: string | undefined = undefined;

    console.log("[CreateRestaurantPage] handleSubmit - Starting. logoFile:", logoFile ? logoFile.name : "null");

    try {
      if (logoFile) {
        console.log("[CreateRestaurantPage] handleSubmit - Uploading logo image...");
        // Use a pasta 'new-restaurant-logos' ou o ID do restaurante se já existir
        const folderPath = user?.id ? `restaurant-logos/${user.id}` : 'restaurant-logos/temp';
        const uploadedUrl = await uploadImageToSupabase(logoFile, 'restaurant-logos', folderPath); // Upload do logo para o bucket 'restaurant-logos'
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl;
          console.log("[CreateRestaurantPage] handleSubmit - Logo image uploaded to:", finalLogoUrl);
        } else {
          throw new Error("Falha ao obter URL do logo após o upload.");
        }
      }

      console.log("[CreateRestaurantPage] handleSubmit - Final logo URL for DB insert:", finalLogoUrl);

      const generatedSlug = slugify(name); // Gerar slug a partir do nome

      await createRestaurant({
        name,
        description,
        address,
        phone,
        email,
        slug: generatedSlug, // Passar o slug gerado
        logo_url: finalLogoUrl || "https://media.istockphoto.com/id/971654072/vector/red-call-icon.jpg?s=612x612&w=0&k=20&c=bwlNm0pnNs98evZv4x8N3Cq3XQAWIKLEzJPmQpbMgWY=", // Passar a URL final do logo
        display_name: name, // Usar o nome completo como display_name padrão
        receive_order_notifications: true, // NOVO: Padrão para true
        receive_delivery_notifications: true, // NOVO: Padrão para true
        notification_email: email, // NOVO: Padrão para o email de contato
        app_icon: dynamicAppIcon, // NOVO: Incluir o ícone do aplicativo (dinâmico)
        app_name: dynamicAppName, // NOVO: Incluir o nome do app (dinâmico)
        admin_header_title: dynamicAdminHeaderTitle, // NOVO: Incluir o título do admin (dinâmico)
        type: restaurantType, // NOVO: Incluir o tipo de restaurante
      });
      // O redirecionamento é tratado no useEffect após a criação bem-sucedida
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoadingSession || isLoadingRestaurants || (session && (isAdmin || isSuperAdmin) && currentRestaurant)) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-2">
            <AppIconComponent className="h-8 w-8 mr-2 text-primary" /> {/* NOVO: Ícone dinâmico */}
            <CardTitle className="text-2xl font-bold">Crie seu Estabelecimento</CardTitle> {/* ATUALIZADO: Título mais genérico */}
          </div>
          <CardDescription>
            Parece que você ainda não tem um estabelecimento configurado.
            Preencha os detalhes para começar a gerenciar seu negócio!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* NOVO: Campo para o tipo de estabelecimento */}
            <div className="grid gap-2">
              <Label htmlFor="restaurantType">Tipo de Estabelecimento</Label>
              <Select value={restaurantType} onValueChange={(value: typeof restaurantType) => setRestaurantType(value)}>
                <SelectTrigger id="restaurantType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurante</SelectItem>
                  <SelectItem value="cafe">Café</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pharmacy">Farmácia</SelectItem>
                  <SelectItem value="market">Mercado</SelectItem>
                  <SelectItem value="petshop">Petshop</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Estabelecimento</Label>
              <Input id="name" placeholder={dynamicNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea id="description" placeholder={dynamicDescriptionPlaceholder} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" placeholder="Rua da Pizza, 123" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(XX) XXXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail de Contato</Label>
                <Input id="email" type="email" placeholder="contato@pizzaria.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-2"> {/* NOVO: Campo para upload de logo */}
              <Label htmlFor="logoUpload">Logo do Estabelecimento (Opcional)</Label>
              <input
                key={logoFileInputKey} // USANDO A CHAVE GERENCIADA PELO ESTADO
                id="logoUpload"
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="flex-1 block w-full text-sm text-gray-500 border border-input rounded-md p-2"
              />
              {logoPreview && (
                <div className="mt-2">
                  <img src={logoPreview} alt="Prévia do Logo" className="h-16 w-auto object-contain rounded-md border" />
                </div>
              )}
            </div>
            {/* NOVO: Campo para o ícone principal do aplicativo */}
            <div className="grid gap-2">
              <Label htmlFor="appIcon" className="flex items-center gap-2">
                Ícone Principal do Aplicativo <IconPreview iconName={dynamicAppIcon} />
              </Label>
              <Input id="appIcon" value={dynamicAppIcon} onChange={(e) => setDynamicAppIcon(e.target.value)} placeholder="Ex: Pizza" />
              <p className="text-xs text-muted-foreground">Este ícone aparece no topo da barra lateral e no cabeçalho da loja.</p>
            </div>
            {/* Seção de busca de ícones (reutilizada) */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Busca de Ícones (Lucide)</h3>
              <Input
                placeholder="Buscar ícone (ex: truck, user, dollar)"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {filteredIcons.map(iconName => (
                  <Button
                    key={iconName}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(iconName);
                      toast.info(`Nome do ícone '${iconName}' copiado para o clipboard.`);
                      setDynamicAppIcon(iconName); // Define o ícone principal ao clicar
                    }}
                    className="flex items-center gap-2"
                  >
                    <IconPreview iconName={iconName} />
                    {iconName}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Estabelecimento"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateRestaurantPage;