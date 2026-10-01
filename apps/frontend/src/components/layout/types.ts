export interface MobileHeaderProps {
  title?: string;
  onMenuClick?: () => void;
  showBack?: boolean;
  onBackClick?: () => void;
  actions?: React.ReactNode;
}