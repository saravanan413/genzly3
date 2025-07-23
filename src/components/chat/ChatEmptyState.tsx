
import React from 'react';
import { MessageSquare } from 'lucide-react';

const ChatEmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No messages yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Send a message to start the conversation
        </p>
      </div>
    </div>
  );
};

export default ChatEmptyState;
