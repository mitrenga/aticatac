<?php

class DataCommand {

  // Co se posílá při startu aplikace. V M1 jsou to dva soubory:
  //
  // - `screen`   – statická podoba startovní místnosti a panelu, vytažená
  //                z běžícího originálu většinovým hlasem (tools/mkroom.py).
  //                Provizorium M1: formát místnosti je M2.
  // - `loading`  – loading screen z kazety (blok SCREEN$ `ATSP`) pro variantu
  //                spuštění LOAD TAPE (tools/mkscreen.py)
  //
  // `global` (výchozí stav hry) tu **schválně není**: je to snímek proměnných
  // originálu a zatím není co snímat (M2/M4). Chybějící soubor dorazí jako
  // null a aplikace to musí přežít – je to poctivá odpověď na otevřenou
  // otázku, ne chyba.
  //
  // Grafika (M2), chůze (M3), pravidla (M4), nepřátelé (M5) a zvuk (M6)
  // přibudou jako další soubory, až budou změřené.
  var $files = ['screen', 'loading', 'global'];

  public function execute($postData) {
    $result = [];
    foreach ($this->files as $file) {
      $fileName = 'data/'.$file.'.json';
      if (!is_file($fileName)) {
        // optional data files (those a later milestone adds) arrive as null
        $result[$file] = null;
        continue;
      }
      $dataJSON = file_get_contents($fileName);
      try {
        $result[$file] = json_decode($dataJSON, false, 512, JSON_THROW_ON_ERROR);
      }
      catch (\JsonException $exception) {
        $result[$file] = ['error' => ['message' => $exception->getMessage()]];
      }
    }

    $mysqli = new mysqli($GLOBALS['dbHostname'], $GLOBALS['dbUser'], $GLOBALS['dbPassword'], $GLOBALS['dbName']);
    $data = $mysqli->query('SELECT `score` FROM `rg_aa_hallOfFame` ORDER BY `score` DESC LIMIT 1');
    $mysqli->close();
    $result['hiScore'] = 0;
    if ($row = $data->fetch_object()) {
      $result['hiScore'] = $row->score;
    }

    return $result;
  } // execute

} // class DataCommand
