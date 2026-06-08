/**
 * Popup App Component
 *
 * Main component for the extension popup.
 * Replace this with your extension's popup UI.
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Card,
  Avatar,
  Separator,
  IconButton,
} from '@radix-ui/themes';
import { GearIcon, ExitIcon, PersonIcon } from '@radix-ui/react-icons';
import { useAuth } from '@hooks/useAuth';
import { useStorage } from '@hooks/useStorage';

interface Settings {
  notifications: boolean;
  syncEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export default function App() {
  const { isAuthenticated, user, loading: authLoading, signIn, signOut } = useAuth();
  const { value: settings, loading: settingsLoading } = useStorage<Settings>('settings', {
    defaultValue: {
      notifications: true,
      syncEnabled: true,
      theme: 'system',
    },
  });

  const loading = authLoading || settingsLoading;

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <Box p="4" style={{ width: 350, minHeight: 200 }}>
        <Flex align="center" justify="center" style={{ height: '100%' }}>
          <Text color="gray">Loading...</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p="4" style={{ width: 350, minHeight: 200 }}>
      {/* Header */}
      <Flex justify="between" align="center" mb="4">
        <Heading size="4">Extension Name</Heading>
        <IconButton variant="ghost" onClick={openOptions}>
          <GearIcon width="18" height="18" />
        </IconButton>
      </Flex>

      {/* Auth Section */}
      {!isAuthenticated ? (
        <Card mb="4">
          <Flex direction="column" align="center" gap="3" p="2">
            <PersonIcon width="32" height="32" />
            <Text align="center" color="gray">
              Sign in to sync your data across devices
            </Text>
            <Button onClick={signIn} style={{ width: '100%' }}>
              Sign in with Google
            </Button>
          </Flex>
        </Card>
      ) : (
        <Card mb="4">
          <Flex gap="3" align="center">
            <Avatar
              size="3"
              src={user?.picture}
              fallback={user?.name?.charAt(0) || 'U'}
              radius="full"
            />
            <Box style={{ flex: 1 }}>
              <Text weight="medium">{user?.name}</Text>
              <Text size="1" color="gray">
                {user?.email}
              </Text>
            </Box>
            <IconButton variant="ghost" color="red" onClick={signOut}>
              <ExitIcon />
            </IconButton>
          </Flex>
        </Card>
      )}

      <Separator size="4" mb="4" />

      {/* Main Content */}
      <Flex direction="column" gap="3">
        <Text color="gray" size="2">
          Replace this with your extension&apos;s main functionality.
        </Text>

        {/* Example Feature Cards */}
        <Card>
          <Flex direction="column" gap="2">
            <Text weight="medium">Feature 1</Text>
            <Text size="2" color="gray">
              Description of feature 1
            </Text>
            <Button variant="soft" size="1">
              Action
            </Button>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Text weight="medium">Feature 2</Text>
            <Text size="2" color="gray">
              Description of feature 2
            </Text>
            <Button variant="soft" size="1">
              Action
            </Button>
          </Flex>
        </Card>
      </Flex>

      {/* Footer */}
      <Separator size="4" mt="4" mb="3" />
      <Flex justify="between" align="center">
        <Text size="1" color="gray">
          v1.0.0
        </Text>
        {settings?.syncEnabled && (
          <Text size="1" color="green">
            Sync enabled
          </Text>
        )}
      </Flex>
    </Box>
  );
}
