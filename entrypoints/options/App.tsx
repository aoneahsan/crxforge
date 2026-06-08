/**
 * Options Page App Component
 *
 * Settings and configuration page for the extension.
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

import {
  Box,
  Flex,
  Text,
  Link,
  Heading,
  Button,
  Card,
  Avatar,
  Switch,
  Separator,
  Select,
  Container,
  Section,
} from '@radix-ui/themes';
import { ExitIcon, PersonIcon } from '@radix-ui/react-icons';
import { useAuth } from '@hooks/useAuth';
import { useStorage } from '@hooks/useStorage';

interface Settings {
  notifications: boolean;
  syncEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export default function App() {
  const { isAuthenticated, user, loading: authLoading, signIn, signOut } = useAuth();
  const {
    value: settings,
    setValue: setSettings,
    loading: settingsLoading,
  } = useStorage<Settings>('settings', {
    defaultValue: {
      notifications: true,
      syncEnabled: true,
      theme: 'system',
    },
  });

  const loading = authLoading || settingsLoading;

  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    if (settings) {
      await setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <Container size="2" p="6">
        <Flex align="center" justify="center" style={{ minHeight: 400 }}>
          <Text color="gray">Loading...</Text>
        </Flex>
      </Container>
    );
  }

  return (
    <Container size="2" p="6">
      <Box mb="6">
        <Heading size="7" mb="2">
          Extension Settings
        </Heading>
        <Text color="gray">
          Configure your extension preferences
        </Text>
      </Box>

      {/* Account Section */}
      <Section size="2">
        <Heading size="4" mb="4">
          Account
        </Heading>

        {!isAuthenticated ? (
          <Card>
            <Flex direction="column" align="center" gap="4" p="4">
              <PersonIcon width="48" height="48" />
              <Box style={{ textAlign: 'center' }}>
                <Heading size="3" mb="2">
                  Sign in to sync
                </Heading>
                <Text color="gray">
                  Sign in with your Google account to sync your settings and
                  data across all your devices.
                </Text>
              </Box>
              <Button size="3" onClick={signIn}>
                Sign in with Google
              </Button>
            </Flex>
          </Card>
        ) : (
          <Card>
            <Flex gap="4" align="center">
              <Avatar
                size="5"
                src={user?.picture}
                fallback={user?.name?.charAt(0) || 'U'}
                radius="full"
              />
              <Box style={{ flex: 1 }}>
                <Heading size="3">{user?.name}</Heading>
                <Text color="gray">{user?.email}</Text>
              </Box>
              <Button variant="soft" color="red" onClick={signOut}>
                <ExitIcon />
                Sign out
              </Button>
            </Flex>
          </Card>
        )}
      </Section>

      <Separator size="4" my="6" />

      {/* Settings Section */}
      <Section size="2">
        <Heading size="4" mb="4">
          General Settings
        </Heading>

        <Flex direction="column" gap="4">
          {/* Theme Setting */}
          <Card>
            <Flex justify="between" align="center">
              <Box>
                <Text weight="medium">Theme</Text>
                <Text size="2" color="gray">
                  Choose your preferred color scheme
                </Text>
              </Box>
              <Select.Root
                value={settings?.theme || 'system'}
                onValueChange={(value) =>
                  updateSetting('theme', value as Settings['theme'])
                }
              >
                <Select.Trigger style={{ width: 130 }} />
                <Select.Content>
                  <Select.Item value="system">System</Select.Item>
                  <Select.Item value="light">Light</Select.Item>
                  <Select.Item value="dark">Dark</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
          </Card>

          {/* Notifications Setting */}
          <Card>
            <Flex justify="between" align="center">
              <Box>
                <Text weight="medium">Notifications</Text>
                <Text size="2" color="gray">
                  Receive notifications about important updates
                </Text>
              </Box>
              <Switch
                checked={settings?.notifications ?? true}
                onCheckedChange={(checked) =>
                  updateSetting('notifications', checked)
                }
              />
            </Flex>
          </Card>

          {/* Sync Setting */}
          <Card>
            <Flex justify="between" align="center">
              <Box>
                <Text weight="medium">Sync data</Text>
                <Text size="2" color="gray">
                  Automatically sync your data across devices
                </Text>
              </Box>
              <Switch
                checked={settings?.syncEnabled ?? true}
                onCheckedChange={(checked) =>
                  updateSetting('syncEnabled', checked)
                }
                disabled={!isAuthenticated}
              />
            </Flex>
            {!isAuthenticated && (
              <Text size="1" color="orange" mt="2">
                Sign in to enable sync
              </Text>
            )}
          </Card>
        </Flex>
      </Section>

      <Separator size="4" my="6" />

      {/* About Section */}
      <Section size="2">
        <Heading size="4" mb="4">
          About
        </Heading>

        <Card>
          <Flex direction="column" gap="3">
            <Flex justify="between">
              <Text color="gray">Version</Text>
              <Text>1.0.0</Text>
            </Flex>
            <Separator size="4" />
            <Flex justify="between">
              <Text color="gray">Developer</Text>
              <Link href="https://aoneahsan.com" target="_blank" rel="noreferrer">
                Ahsan Mahmood
              </Link>
            </Flex>
            <Separator size="4" />
            <Flex gap="2" mt="2">
              <Button
                variant="soft"
                size="1"
                onClick={() => window.open('https://example.com/privacy')}
              >
                Privacy Policy
              </Button>
              <Button
                variant="soft"
                size="1"
                onClick={() => window.open('https://example.com/terms')}
              >
                Terms of Service
              </Button>
              <Button
                variant="soft"
                size="1"
                onClick={() => window.open('https://example.com/support')}
              >
                Support
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Section>
    </Container>
  );
}
