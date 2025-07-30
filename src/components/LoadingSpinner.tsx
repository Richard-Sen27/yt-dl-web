interface LoadingSpinnerProps {
  text?: string;
}

export default function LoadingSpinner({ text = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  );
}
