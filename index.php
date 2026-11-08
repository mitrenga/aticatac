<?php
  $appName = 'ATIC ATAC';
  $appDescription = 'Play ATIC ATAC online for free in your browser. Faithful remake of the 1983 Ultimate Play The Game ZX Spectrum classic, no download required.';
  $appPrefix = 'aa';
  $appNoscript =
    '<h1>ATIC ATAC</h1>'.
    '<p>Atic Atac is the 1983 ZX Spectrum game by Ultimate Play The Game, written for the 48K '.
    'machine. You are locked in a haunted castle as a knight, a wizard or a serf, and the way out '.
    'is the front door — which takes a key in three pieces, found somewhere in the rooms, past '.
    'whatever lives in them, while the roast chicken that is your health runs down.</p>'.
    '<p>This is a faithful remake that runs directly in your web browser. '.
    'There is nothing to install and nothing to download — just open the page and play. '.
    'Please enable JavaScript to start the game.</p>'.
    '<p><a href="about">More about Atic Atac and this remake</a></p>';
  $appOpenGraph = [
    'image' => 'images/poster.png',
  ];
  $appJsonLd = [
    'genre' => 'Action-adventure',
    'isBasedOn' => [
      '@type' => 'VideoGame',
      'name' => 'Atic Atac',
      'publisher' => [
        ['@type' => 'Organization', 'name' => 'Ultimate Play The Game'],
      ],
      'datePublished' => '1983',
      'gamePlatform' => 'ZX Spectrum',
    ],
  ];
  require_once 'config/config.php';
  require_once 'app/svision/php/main.php';
