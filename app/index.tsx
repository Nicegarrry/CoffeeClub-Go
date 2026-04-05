import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/hooks/useTheme';
import { Fonts } from '../src/constants/theme';
import { stories, recentBrews, beans, brewGradients } from '../src/constants/mockData';
import type { Story } from '../src/constants/mockData';

import { Header } from '../src/components/layout/Header';
import { StoryRing } from '../src/components/ui/StoryRing';
import { BrewCard } from '../src/components/ui/BrewCard';
import { SectionHeader } from '../src/components/ui/SectionHeader';
import { SetupCard } from '../src/components/setup/SetupCard';
import { BeanCard } from '../src/components/setup/BeanCard';
import TabBar from '../src/components/layout/TabBar';
import BrewLogSheet from '../src/components/brew/BrewLogSheet';
import StoryViewer from '../src/components/social/StoryViewer';
import { useBrewLogger } from '../src/hooks/useBrewLogger';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return 'Morning';
  if (hour >= 9 && hour < 12) return 'Late morning';
  if (hour >= 12 && hour < 15) return 'Afternoon';
  return 'Evening';
}

function getFormattedDate(): string {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [seenStories, setSeenStories] = useState<Set<number>>(new Set([3, 6]));
  const [activeTab, setActiveTab] = useState('home');
  const brewLogger = useBrewLogger();

  const handleStoryPress = (story: Story) => {
    setSeenStories(prev => new Set([...prev, story.id]));
    setActiveStory(story);
  };

  const renderStoryItem = ({ item }: { item: Story }) => (
    <StoryRing
      avatar={item.avatar}
      name={item.name}
      seen={seenStories.has(item.id)}
      isSponsored={item.isSponsored}
      onPress={() => handleStoryPress(item)}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingLeft}>
              <Text style={[styles.dateText, { color: colors.textFaint }]}>
                {getFormattedDate()}
              </Text>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {getGreeting()},{' '}
                <Text style={[styles.greetingName, { color: colors.accent }]}>Nick.</Text>
              </Text>
              <Text style={[styles.statText, { color: colors.textSub }]}>
                4 brews this week · on a roll
              </Text>
            </View>
            <LinearGradient
              colors={colors.storyRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={[styles.avatarInner, { backgroundColor: colors.bgCard }]}>
                <Text style={[styles.avatarText, { color: colors.accent }]}>N</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Stories Section */}
          <SectionHeader
            title="Activity near you"
            subtitle="6 brewing"
            action="See all"
          />
          <FlatList
            data={stories}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderStoryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
            snapToInterval={80}
            decelerationRate="fast"
            ListHeaderComponent={
              <StoryRing
                name="You"
                isAddButton
                onPress={() => {}}
              />
            }
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Recent Brews */}
          <SectionHeader
            title="Your recent brews"
            subtitle="this week"
            action="See all"
          />
          <View style={styles.brewsList}>
            {recentBrews.map((brew, index) => (
              <BrewCard
                key={brew.id}
                brew={brew}
                gradientColors={brewGradients[index % brewGradients.length] as [string, string, string]}
                onPress={() => {}}
              />
            ))}
          </View>

          {/* Setup Section */}
          <View style={[styles.setupDivider, { borderTopColor: colors.border }]}>
            <SectionHeader
              title="Your setup"
              subtitle="dialled in"
              action="Edit"
            />
          </View>
          <View style={styles.setupGrid}>
            <View style={styles.setupCardWrap}>
              <SetupCard
                category="Machine"
                name="Breville Barista Express"
                detail="67mm flat burr"
                emoji="☕"
                bgColor={colors.machBg}
                dotColor="#5B9BD5"
              />
            </View>
            <View style={styles.setupGap} />
            <View style={styles.setupCardWrap}>
              <SetupCard
                category="Grinder"
                name="Comandante C40"
                detail="Nitro Blade"
                emoji="⚙️"
                bgColor={colors.grindBg}
                dotColor="#D57B5B"
              />
            </View>
          </View>

          {/* Beans Section */}
          <View style={styles.beansHeader}>
            <SectionHeader
              title="Available beans"
              action="Add +"
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.beansList}
            snapToInterval={164}
            decelerationRate="fast"
          >
            {beans.map((bean) => (
              <BeanCard key={bean.id} bean={bean} onPress={() => {}} />
            ))}
            {/* Add new beans dashed card */}
            <Pressable
              style={[styles.addBeanCard, { borderColor: colors.border }]}
              onPress={() => {}}
            >
              <View style={[styles.addBeanCircle, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.addBeanIcon, { color: colors.accent }]}>+</Text>
              </View>
              <Text style={[styles.addBeanText, { color: colors.textFaint }]}>
                Add new{'\n'}beans
              </Text>
            </Pressable>
          </ScrollView>

          {/* Bottom spacer for tab bar */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        onPressAdd={brewLogger.open}
      />

      {/* Brew Log Sheet */}
      <BrewLogSheet
        isOpen={brewLogger.isOpen}
        showDetails={brewLogger.showDetails}
        quickLogData={brewLogger.quickLogData}
        detailData={brewLogger.detailData}
        onClose={brewLogger.close}
        onSubmit={brewLogger.submit}
        onToggleDetails={brewLogger.toggleDetails}
        setQuickField={brewLogger.setQuickField}
        setDetailField={brewLogger.setDetailField}
      />

      {/* Story Viewer */}
      {activeStory && (
        <StoryViewer
          story={activeStory}
          onClose={() => setActiveStory(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },

  // Greeting
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 20,
    marginTop: 4,
  },
  greetingLeft: {
    flex: 1,
    marginRight: 16,
  },
  dateText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  greeting: {
    fontFamily: Fonts.display,
    fontSize: 27,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  greetingName: {
    fontFamily: Fonts.displayItalic,
  },
  statText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 5,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '700',
  },

  // Stories
  storiesList: {
    paddingHorizontal: 18,
    gap: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },

  // Divider
  divider: {
    height: 1,
    marginHorizontal: 18,
    marginBottom: 20,
  },

  // Brews
  brewsList: {
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 4,
  },

  // Setup
  setupDivider: {
    marginTop: 24,
    paddingTop: 22,
    borderTopWidth: 1,
  },
  setupGrid: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  setupCardWrap: {
    flex: 1,
  },
  setupGap: {
    width: 10,
  },

  // Beans
  beansHeader: {
    marginBottom: 2,
  },
  beansList: {
    paddingHorizontal: 18,
    gap: 10,
    paddingBottom: 6,
  },
  addBeanCard: {
    width: 110,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  addBeanCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBeanIcon: {
    fontSize: 20,
  },
  addBeanText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Bottom
  bottomSpacer: {
    height: 112,
  },
});
