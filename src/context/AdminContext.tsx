const getUsers = (): User[] => {
    return JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
  };

  const updateUserPlan = (userId: string, plan: 'free' | 'premium' | 'enterprise') => {
    const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex !== -1) {
      const limits = {
        free: 10,
        premium: 100,
        enterprise: -1
      };
      users[userIndex] = { ...users[userIndex], plan, messagesLimit: limits[plan] };
      localStorage.setItem('vaaniai-users', JSON.stringify(users));
      
      // Update current user if it's the same user
      const currentUser = JSON.parse(localStorage.getItem('vaaniai-user') || 'null');
      if (currentUser && currentUser.id === userId) {
        const updatedCurrentUser = { ...currentUser, plan, messagesLimit: limits[plan] };
        localStorage.setItem('vaaniai-user', JSON.stringify(updatedCurrentUser));
      }
    }
  };

  const deleteUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
    const filteredUsers = users.filter((u: any) => u.id !== userId);
    localStorage.setItem('vaaniai-users', JSON.stringify(filteredUsers));
  };

  const getApiConfig = (): ApiConfig => {
    const saved = localStorage.getItem('vaaniai-api-config');
    if (saved) {
      return JSON.parse(saved);
    }
  };

  const updateApiConfig = (config: ApiConfig) => {
    localStorage.setItem('vaaniai-api-config', JSON.stringify(config));
  };