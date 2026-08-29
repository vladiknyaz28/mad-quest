import { useEffect, useState } from 'react';
import { voiceRecorder, type RecorderState } from './recorder';

export function useVoiceRecorder(): RecorderState {
  const [state, setState] = useState<RecorderState>(voiceRecorder.getState());

  useEffect(() => {
    void voiceRecorder.init();
    return voiceRecorder.subscribe(setState);
  }, []);

  return state;
}
