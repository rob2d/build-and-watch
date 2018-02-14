#include "gb/gb.h"
#include "gb/cgb.h"
#include "stdio.h"
#include "alpha.c"
#include "gbplus/fixedpoint.h"
#include "gbplus/joystick.h"
#include "gbplus/sincos.h"
#include "blankScreen.c"


UWORD bkgPalette[] = {
        RGB(0,2,1), RGB(1, 10, 1), RGB(2,5,2), RGB(0, 31, 0)
};

BOOLEAN flipSprite = 0;
// The player array will hold the player's position as X ([0]) and Y ([1])
signed INT16 playerX;
signed INT16 playerY;
signed UINT16 playerAngle = 0;

        
signed INT16 intermediateXPos;
signed INT16 intermediateYPos;

unsigned UINT8 xPos = (UINT8)intermediateXPos;
unsigned UINT8 yPos = (UINT8)intermediateYPos;
signed INT16 velocity = 0;
signed INT16 gravity = 0;

// =================================== //
//        Comparison Variables         //
// ====================================//

// Use these for temporary variable assignment;
// LCC sucks and this step is needed for comparisons.
// Normally, we won't access these directly.
// They can be referenced with macros

signed INT16 tempInt16A;
signed INT16 tempInt16B;

// ==================================== //


// The player array will hold the player's position as X ([0]) and Y ([1])
unsigned UINT8 player[2];
unsigned int joystickState = 0xFF;
signed INT16 fixedIntTest = 0x22;

void updateSwitches();
void init();
void checkInput();

void main() {
        set_bkg_palette( 0, 2, bkgPalette ); 
        fixedIntTest = (INT16)-30+ROUND_TO_INT((INT16)cosBy2s[0]*(INT16)-5);
        
        while(1) {
                
        printf("hey");
        printSigned("cosBy2s[0]: %d\n",  fixedIntTest);
        printSigned("sinBy2s[1]: %d\n", sinBy2s[160]);
        printUnsigned("ROUND_TO_INT(0x22): %d\n", (UINT16) fixedIntTest);
                checkInput();
                updateSwitches(); // make sure 
                wait_vbl_done();  // Wait until VBLANK to avoid corrupting memory
        }
}

void checkInput() {

        if (joypad() & J_A) {
                if(playerY == VERTICAL_FLOOR) {
                        gravity = -INT_TO_FIXED(4);
                }
        }

        // LEFT
        if (joypad() & J_LEFT) {
                if(velocity == 0) {
                        velocity -= 4; //quick boost at 0
                }

                if(velocity > MAX_CONTROLLED_VELOCITY *-1) {
                        velocity -= 2;
                }                
                if(!flipSprite) {    
                        set_sprite_prop(0,S_FLIPX);
                        set_sprite_prop(2,S_FLIPX);
                        flipSprite = 1;
                }
        }	

        // RIGHT
        if (joypad() & J_RIGHT) {
                
                if(velocity == 0) {
                        velocity += 4; //quick boost at 0
                }
                if(velocity < MAX_CONTROLLED_VELOCITY) {
                        velocity += 2;
                }

                if(flipSprite) {    
                        set_sprite_prop(0,get_sprite_prop(0) ^ S_FLIPX);
                        set_sprite_prop(2,get_sprite_prop(2) ^ S_FLIPX);
                        flipSprite = 0;
                }
        }

        if(velocity < 0 && ROUND_TO_INT(playerX) <= 8) {
                velocity = 0;
        }

        if(velocity > 0 && ROUND_TO_INT(playerX) >= 160) {
                velocity = 0;
        }

        if(velocity > 0 && !joypad() && playerY >= VERTICAL_FLOOR) {
                velocity -= DECELLERATION;
        }

        if(velocity < 0 && !joypad() && playerY >= VERTICAL_FLOOR) {
                velocity += DECELLERATION;
        }
        
        
        tempInt16A = (INT16)ROUND_TO_INT(velocity  * cosBy2s[0]);
        playerX = playerX + tempInt16A;


        
        // =================================== //
        //              Gravity                //
        // ====================================//
        /*
        if(gravity < INT_TO_FIXED(100) && playerY < VERTICAL_FLOOR) {
                gravity += 7;
        }

        playerYNext = playerY + gravity;

        if((playerYNext > VERTICAL_FLOOR) && gravity > 0) {
                gravity = 0;
                playerY = VERTICAL_FLOOR;
        }
        
        playerY += gravity;
        */

        // Move the sprite in the first movable sprite list (0)
        //  the the position of X (playerX) and y (playerY)
        
        intermediateXPos = ROUND_TO_INT(playerX);
        intermediateYPos = ROUND_TO_INT(playerY);

        xPos = (UINT8)intermediateXPos;
        yPos = (UINT8)intermediateYPos;
        
        if(!flipSprite) {
                move_sprite(0, xPos-4, yPos);
                move_sprite(2, xPos+4, yPos);
        } else {
                move_sprite(0, xPos+4, yPos);
                move_sprite(2, xPos-4, yPos);
        }
}

void init() {
	                
	DISPLAY_ON;				// Turn on the display
}

void updateSwitches() {
	
	HIDE_WIN;
	SHOW_SPRITES;
	SHOW_BKG;
	
}