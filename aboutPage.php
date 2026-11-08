<?php

require_once 'app/svision/php/abstractAboutPage.php';

/**
 * The /about page: the story of the original Atic Atac and of this remake.
 * M1 text; the final content comes with M7.
 */
class AboutPage extends AbstractAboutPage {

  protected function aboutData() {
    return [
      'image' => 'images/cover.png',
      'sections' => [
        [
          'heading' => 'The original game (1983)',
          'html' =>
            '<p>Atic Atac was released by Ultimate Play The Game in 1983 for the 48K ZX Spectrum. '.
            'You are locked in a haunted castle, seen from above, and the way out is the front door — '.
            'which takes a key that comes in three pieces. The castle is a maze of rooms on several '.
            'floors, full of things that want you dead, and your health is a roast chicken in the '.
            'corner of the screen that quietly eats itself away while you look for them.</p>'.
            '<p>Its menu offers a choice of keyboard, Kempston or Cursor joystick, and — unusually for '.
            'its year — a choice of who you play: a knight, a wizard or a serf, each with a weapon and '.
            'ways through the castle of their own.</p>',
        ],
        [
          'heading' => 'This remake',
          'html' =>
            '<p>This is a faithful remake, rewritten for the web browser rather than emulated. The graphics '.
            'and the rules are taken out of the original program, not redrawn and not copied from a wiki — '.
            'where a rule cannot be shown, it is left as an open question rather than guessed. Even the '.
            'frame rate is the Spectrum\'s own 50.08 Hz, and the attribute clash of the hardware is '.
            'reproduced instead of cleaned up.</p>'.
            '<p>It is being built in milestones, and it is early: the tape has been taken apart, the '.
            'loading screen is the real one loaded byte by byte off it, and the game screen is the '.
            'original\'s own picture — but nothing moves yet, because how anybody moves has not been '.
            'read out of the program so far. That is the method, not an oversight.</p>'.
            '<p>It runs directly in your browser — nothing to install, nothing to download. Keyboard, '.
            'touch controls and gamepads are supported.</p>'.$this->installNote(),
        ],
        [
          'heading' => 'Other games',
          'html' =>
            '<p>This remake is one of a growing collection of classic games from the 8-bit and 16-bit era '.
            '— ZX Spectrum, Commodore 64, arcade and more — rebuilt faithfully on the same library and '.
            'playable in your browser, free of charge. Browse the whole collection at '.
            '<a href="https://retrogames.free/" target="_blank" rel="noopener">retrogames.free</a>.</p>',
        ],
      ],
      'links' => [
        ['label' => 'Atic Atac at Spectrum Computing', 'url' => 'https://spectrumcomputing.co.uk/'],
        ['label' => 'Atic Atac at World of Spectrum', 'url' => 'https://worldofspectrum.org/'],
      ],
      'footer' =>
        '<p>An unofficial fan remake. The original game and its artwork belong to their authors '.
        '(Ultimate Play The Game, today Rare/Microsoft). '.
        'The remake\'s source code is licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>.</p>',
    ];
  } // aboutData

} // AboutPage
