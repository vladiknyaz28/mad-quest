import { useEffect, useState } from 'react';
import { audioPlayer, type AudioPlayerState } from './audioPlayer';

export function useAudioPlayer(): AudioPlayerState {
  const [state, setState] = useState<AudioPlayerState>(audioPlayer.getState());

  useEffect(() => audioPlayer.subscribe(setState), []);

  return state;
}
