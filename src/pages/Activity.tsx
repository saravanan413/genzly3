
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import Layout from '../components/Layout';

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
  {
    id: 4,
    type: 'like',
    user: 'foodie_expert',
    avatar: 'https://via.placeholder.com/40/FF6347/FFFFFF?Text=F',
    message: 'liked your photo',
    time: '2h',
    postImage: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=60'
  },
  {
    id: 5,
    type: 'comment',
    user: 'tech_enthusiast',
    avatar: 'https://via.placeholder.com/40/9370DB/FFFFFF?Text=T',
    message: 'commented: "Love this setup! 💻"',
    time: '3h',
    postImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=60'
  },
];

const Activity = () => {
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
    <Layout>
      <div className="p-4">
        <div className="container mx-auto max-w-lg">
          <h1 className="text-2xl font-bold mb-6">Activity</h1>
          
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-card rounded-lg border">
                <div className="relative">
                  <img 
                    src={activity.avatar} 
                    alt={activity.user} 
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{activity.message}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                
                {activity.postImage && (
                  <img 
                    src={activity.postImage} 
                    alt="Post" 
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Activity;
