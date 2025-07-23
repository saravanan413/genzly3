import { Heart, MessageCircle, UserPlus } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'like',
    user: 'sarah_jones',
    avatar: 'https://via.placeholder.com/40/FF69B4/FFFFFF?Text=S',
    message: 'liked your photo',
    time: '2m',
    postImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=60'
  },
  {
    id: 2,
    type: 'comment',
    user: 'mike_photographer',
    avatar: 'https://via.placeholder.com/40/4169E1/FFFFFF?Text=M',
    message: 'commented: "Amazing shot! 📸"',
    time: '5m',
    postImage: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=60'
  },
  {
    id: 3,
    type: 'follow',
    user: 'travel_blogger_jane',
    avatar: 'https://via.placeholder.com/40/32CD32/FFFFFF?Text=J',
    message: 'started following you',
    time: '1h',
    postImage: null
  },
];

const ActivityDropdown = () => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="text-red-500" size={16} />;
      case 'comment':
        return <MessageCircle className="text-blue-500" size={16} />;
      case 'follow':
        return <UserPlus className="text-green-500" size={16} />;
      default:
        return <Heart className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-4 p-4 bg-card rounded-xl border hover:bg-gray-50 hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
              <img 
                src={activity.avatar} 
                alt={activity.user} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border">
              {getActivityIcon(activity.type)}
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold group-hover:text-primary transition-colors duration-200">{activity.user}</span>{' '}
              <span className="text-muted-foreground">{activity.message}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
          </div>
          
          {activity.postImage && (
            <img 
              src={activity.postImage} 
              alt="Post" 
              className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform duration-200"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ActivityDropdown;
