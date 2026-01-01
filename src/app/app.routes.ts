import { Routes } from '@angular/router';
import { HexBoardComponent } from './hex-board/hex-board.component';
import { MoveCardComponent } from './move-card/move-card.component';
import { MoveCardBatchComponent } from './move-card-batch/move-card-batch.component';
import { About } from './about/about';

export const routes: Routes = [
	{ path: 'hex-board', component: HexBoardComponent },
	{ path: 'move-card', component: MoveCardComponent },
	{ path: 'move-card-batch', component: MoveCardBatchComponent },
	{ path: 'about', component: About },
];
