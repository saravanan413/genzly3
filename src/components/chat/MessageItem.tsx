
import React from 'react';
import SharedContentMessage from './SharedContentMessage';
import MessageStatus from './MessageStatus';
import { DisplayMessage, SharedContent } from '../../types/chat';

interface MessageItemProps {
  message: DisplayMessage;
  onSharedContent?: (content: SharedContent) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onSharedContent }) => {
  const getSharedContentType = (type: string): 'post' | 'reel' | 'image' | 'video' => {
    switch (type) {
      case 'video':
      case 'reel':
        return 'reel';
      case 'image':
      case 'post':
        return 'post';
      default:
        return 'image';
    }
  };

  return (
    <div
      key={message.id}
      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[70%] ${message.isOwn ? 'order-2' : 'order-1'}`}>
        {message.content ? (
          <SharedContentMessage
            content={{
              type: getSharedContentType(message.content.type),
              url: message.content.url,
              image: message.content.url,
            }}
            isOwn={message.isOwn}
            onClick={onSharedContent}
          />
        ) : (
          <div
            className={`px-4 py-2 rounded-2xl ${
              message.isOwn
                ? 'bg-primary text-primary-foreground ml-2'
                : 'bg-white dark:bg-gray-800 text-foreground mr-2 border'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.text}
            </p>
          </div>
        )}
        
        <div
          className={`flex items-center justify-between mt-1 px-2 ${
            message.isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {message.time}
          </span>
          {message.isOwn && (
            <div className="ml-2">
              <MessageStatus message={message} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
