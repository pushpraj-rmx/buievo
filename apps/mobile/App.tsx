import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { MessageCircle, Users, Megaphone, FileText, FolderOpen, Bot, RadioTower } from 'lucide-react-native';

export default function App() {
  const [activeTab, setActiveTab] = useState('chats');

  const tabs = [
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'broadcast', label: 'Broadcast', icon: RadioTower },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'media', label: 'Media', icon: FolderOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>WhatsApp Chats</Text>
            <Text style={styles.subtitle}>Manage your conversations</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Chat list will appear here</Text>
            </View>
          </View>
        );
      case 'contacts':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Contacts</Text>
            <Text style={styles.subtitle}>Manage your contact list</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Contact list will appear here</Text>
            </View>
          </View>
        );
      case 'campaigns':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Campaigns</Text>
            <Text style={styles.subtitle}>Create and manage campaigns</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Campaign management will appear here</Text>
            </View>
          </View>
        );
      case 'broadcast':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Broadcast</Text>
            <Text style={styles.subtitle}>Send messages to multiple contacts</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Broadcast management will appear here</Text>
            </View>
          </View>
        );
      case 'templates':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Templates</Text>
            <Text style={styles.subtitle}>Message templates</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Template management will appear here</Text>
            </View>
          </View>
        );
      case 'media':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Media</Text>
            <Text style={styles.subtitle}>Manage media files</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Media management will appear here</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Bot size={24} color="#1a1a1a" />
          <Text style={styles.headerTitle}>Whatssuite</Text>
        </View>
        <Text style={styles.headerSubtitle}>WhatsApp Business Suite</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.mainContent}>
        {renderContent()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <tab.icon size={20} color={activeTab === tab.id ? '#007AFF' : '#666666'} />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 10,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  placeholder: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 10,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },

  tabLabel: {
    fontSize: 12,
    color: '#666666',
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
