import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { PlaybackService } from './src/services/PlayerService';

TrackPlayer.registerPlaybackService(() => PlaybackService);
registerRootComponent(App);
