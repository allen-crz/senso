// Barrel export for UI components to enable better tree shaking
// This file helps Vite create separate chunks for UI components

// Core UI components
export { Button } from './button';
export { Input } from './input';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Label } from './label';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

// Form components
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Textarea } from './textarea';
export { Switch } from './switch';
export { Checkbox } from './checkbox';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Slider } from './slider';

// Navigation components
export { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu';
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from './command';

// Layout components
export { Separator } from './separator';
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
export { ScrollArea, ScrollBar } from './scroll-area';

// Feedback components
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Badge } from './badge';
export { Progress } from './progress';
export { Skeleton } from './skeleton';
export { Spinner } from './spinner';

// Overlay components
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './alert-dialog';
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
export { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu';

// Advanced components
export { Avatar, AvatarFallback, AvatarImage } from './avatar';
export { AspectRatio } from './aspect-ratio';
export { Toggle, ToggleGroup, ToggleGroupItem } from './toggle';
export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './carousel';

// Chart components (if they exist)
export * from './chart';

// Toast components
export { toast } from './use-toast';
export { Toaster } from './toaster';
export { toast as sonnerToast } from 'sonner';
export { Toaster as SonnerToaster } from './sonner';

// Sidebar components
export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar } from './sidebar';

export default {
  // Group exports for easier importing
  forms: {
    Button,
    Input,
    Label,
    Form,
    Select,
    Textarea,
    Switch,
    Checkbox,
    RadioGroup,
    Slider,
  },
  layout: {
    Card,
    Tabs,
    Separator,
    Accordion,
    ScrollArea,
  },
  feedback: {
    Alert,
    Badge,
    Progress,
    Skeleton,
  },
  overlays: {
    Dialog,
    AlertDialog,
    Popover,
    Tooltip,
    DropdownMenu,
  },
};