"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import * as LucideIcons from "lucide-react"; // Importar todos os ícones Lucide
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button"; // Importação adicionada
import { toast } from "sonner";

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
  "Trash", "TreeDeciduous", "TreePine", "Trees", "Trello", "TrendingDown", "TrendingUp", "Triangle", "Truck", "Tvm",
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

interface AppNameSettingsCardProps {
  appName: string;
  setAppName: (name: string) => void;
  adminHeaderTitle: string;
  setAdminHeaderTitle: (title: string) => void;
  appIcon: string; // NOVO: Prop para o ícone do aplicativo
  setAppIcon: (icon: string) => void; // NOVO: Setter para o ícone do aplicativo
}

const AppNameSettingsCard: React.FC<AppNameSettingsCardProps> = ({
  appName,
  setAppName,
  adminHeaderTitle,
  setAdminHeaderTitle,
  appIcon, // NOVO: Desestruturar appIcon
  setAppIcon, // NOVO: Desestruturar setAppIcon
}) => {
  const [iconSearch, setIconSearch] = React.useState("");
  const [filteredIcons, setFilteredIcons] = React.useState(availableIcons);

  React.useEffect(() => {
    setFilteredIcons(
      availableIcons.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase()))
    );
  }, [iconSearch]);

  const IconPreview: React.FC<{ iconName: string }> = ({ iconName }) => {
    const IconComponent = (LucideIcons as any)[iconName] || Terminal;
    return IconComponent ? <IconComponent className="h-5 w-5 text-primary" /> : <Terminal className="h-5 w-5 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nome do Aplicativo e Títulos</CardTitle>
        <CardDescription>Defina o nome principal do aplicativo e o título exibido no cabeçalho do painel administrativo.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="appName">Nome Principal do Aplicativo (Sidebar)</Label>
          <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Ex: Pizza Manager" />
          <p className="text-xs text-muted-foreground">Este nome aparece no topo do menu lateral.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="adminHeaderTitle">Título do Cabeçalho Admin</Label>
          <Input id="adminHeaderTitle" value={adminHeaderTitle} onChange={(e) => setAdminHeaderTitle(e.target.value)} placeholder="Ex: PizzaApp Admin" />
          <p className="text-xs text-muted-foreground">Este nome aparece no cabeçalho principal e no menu mobile.</p>
        </div>
        {/* NOVO: Campo para o ícone principal do aplicativo */}
        <div className="grid gap-2">
          <Label htmlFor="appIcon" className="flex items-center gap-2">
            Ícone Principal do Aplicativo <IconPreview iconName={appIcon} />
          </Label>
          <Input id="appIcon" value={appIcon} onChange={(e) => setAppIcon(e.target.value)} placeholder="Ex: Pizza" />
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
                  setAppIcon(iconName); // Define o ícone principal ao clicar
                }}
                className="flex items-center gap-2"
              >
                <IconPreview iconName={iconName} />
                {iconName}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppNameSettingsCard;