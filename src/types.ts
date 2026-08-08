export interface Team {
  id: number;
  name: string;
  banner: string;
  score: number;
  color: string;
  password?: string;
}

export interface Game {
  id: number;
  name: string;
  open: boolean;
}

export interface Question {
  id: number;
  clue: string;
  hint: string;
  hintCost: number;
  answerKeywords: string[];
  solvePoints: number;
}

export interface CSIProgress {
  answered: number[]; // indices/ids of solved questions (0-indexed)
  hintsBought: number[]; // indices/ids of bought hints (0-indexed)
  currentQ: number; // index of currently active question
  answers?: Record<string, string>; // Maps question index string to uploaded base64 / photo URL
}

export interface GalleryPhoto {
  id: string;
  url: string; // Base64 string or image URL
  teamName: string;
  timestamp: string;
}

export interface AppState {
  customTitle: string;
  teams: Team[];
  games: Game[];
  gallery: GalleryPhoto[];
  teamProgress: Record<string, CSIProgress>; // Keyed by string representation of team id
}
