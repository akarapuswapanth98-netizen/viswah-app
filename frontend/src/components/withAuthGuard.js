import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getAuthToken } from '../config/api';

export default function withAuthGuard(WrappedComponent) {
  return function AuthGuard(props) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          await getAuthToken();
        } catch (e) {
          // token unavailable, user not logged in
        } finally {
          setLoading(false);
        }
      };
      checkAuth();
    }, []);

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FE',
  },
});
