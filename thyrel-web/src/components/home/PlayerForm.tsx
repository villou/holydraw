import { useRandomUsername } from 'hooks/useRandomUsername';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { Notification } from 'rsuite';
import { client } from '../../api/client';
import { setToken } from '../../api/player-provider';
import profilesPictures from '../../images/profiles/profiles-pictures';
import Box from '../../styles/Box';
import Player from '../../types/Player.type';
import BigButton from '../BigButton';
import BigInput from '../BigInput';
import ButtonModalJoin from './ButtonModalJoin';
import PlayerAvatar from './PlayerAvatar';

export default function PlayerForm({ identifier }: { identifier?: string }) {
  const [username, setUsername] = React.useState('');
  const [ppIndex, setPpIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const history = useHistory();
  const defaultUsername = useRandomUsername();
  const nextPp = () => {
    setPpIndex((p: number) => (p > profilesPictures.length - 2 ? 0 : p + 1));
  };

  function onStart() {
    setLoading(true);
    client<Player>('room', {
      data: {
        username: username || defaultUsername,
        avatarUrl: String(ppIndex),
      },
    }).then(
      (player: Player) => {
        setLoading(false);
        if (player.token?.tokenKey) {
          Notification['success']({
            title: 'Room successfully created.',
            description: 'Invite your friends.',
          });
          setToken(player.token.tokenKey);
          // to redirect to an other page
          history?.push('/r/lobby');
        }
      },
      () => {
        setLoading(false);
        Notification.error({ title: 'An error occured' });
      },
    );
  }

  function onJoin(identifier: string) {
    setLoading(true);
    client<Player>(`room/join/${identifier}`, {
      data: {
        username: username || defaultUsername,
        avatarUrl: String(ppIndex),
      },
      method: 'PATCH',
    }).then(
      (player: Player) => {
        setLoading(false);
        if (player.token?.tokenKey) {
          Notification['success']({
            title: 'Room successfully created.',
            description: 'Invite your friends.',
          });
          setToken(player.token.tokenKey);
          // to redirect to an other page
          history?.push('/r/lobby');
        }
      },
      () => {
        setLoading(false);
        Notification.error({ title: 'An error occured' });
      },
    );
  }

  return (
    <Box flexDirection="column" alignItems="center" width="100%" gap={24}>
      <PlayerAvatar image={profilesPictures[ppIndex]} onShuffle={nextPp} />

      <BigInput
        icon={'edit'}
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder={defaultUsername}
      />

      <Box flexDirection="column" alignItems="center" width="100%" gap={12}>
        <ButtonModalJoin
          identifier={identifier}
          onClick={onJoin}
          loading={loading}
        />

        {!identifier && (
          <BigButton
            icon="angle-double-right"
            size="lg"
            onClick={onStart}
            loading={loading}>
            Start
          </BigButton>
        )}
      </Box>
    </Box>
  );
}
