import { usePlayerContext } from 'hooks/PlayerProvider';
import { client } from 'api/client';
import Session from 'types/Session.type';
import StartButton from './StartButton';
import { getToken } from 'api/player-provider';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

export default function LobbyStartAction() {
  const { player } = usePlayerContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  function onStart() {
    setIsLoading(true);
    client<Session>('session', { method: 'POST', token: getToken() })
      .then(
        () =>
          enqueueSnackbar('Game successfully started 💪', {
            variant: 'success',
          }),
        error =>
          enqueueSnackbar(
            error || 'Sorry, an error occurred 😕 [Session-POST]',
            { variant: 'error' },
          ),
      )
      .finally(() => setIsLoading(false));
  }

  return (
    <StartButton onClick={onStart} isLoading={isLoading} player={player} />
  );
}
