# data/

Datové soubory, které jdou do prohlížeče. **Každý z nich vyrábí nástroj
z `../tools/` z originálu** — žádný se needituje ručně a žádný neobsahuje
číslo, které by někdo odhadl.

| soubor | co v něm je | dělá ho | doloženo |
|---|---|---|---|
| `loading.json` | loading screen z kazety: videopaměť `$4000–$5AFF` tak, jak leží v paměti stroje (6144 B bitmapy v nelineárním adresování ULA + 768 B atributů, base64) | `tools/mkscreen.py` z `sources/media/screens/loading_screen.scr` | `tools/matchloading.py` — **20 736 kontrol, 0 rozdílů** |
| `screen.json` | statická podoba startovní místnosti a panelu z běhu originálu: hrací plocha (sloupce 0–23) většinovým hlasem přes 144 vzorků, panel z jednoho snímku | `tools/mkroom.py` | `tools/matchscreen.mjs` — **6912 kontrol, 0 rozdílů** |

## ★ `screen.json` je provizorium M1, a je to napsané i v něm

Formát místnosti originálu zatím **není známý** (`../ZADANI.md` §9, otázka 5).
Do té doby se místnost kreslí ze zachyceného obrazu — ale **z jeho vlastních
bajtů**, ne z překreslené grafiky. Až M2 formát najde, přestane být tenhle
soubor zdrojem obrázku a zůstane jako **nezávislá kontrola**: většinový hlas
nad pixely běžícího originálu o formátu nepředpokládá nic.

Hrací plocha a panel se berou jinak schválně: přes plochu chodí postava
a nepřátelé, takže tam většinový hlas dává smysl; v panelu běží čas a skóre,
takže „nejčastější hodnota bajtu" by dala číslici, která na obrazovce nikdy
nestála naráz se zbytkem.

## Co tu zatím není

`global.json` (výchozí stav hry), `sprites.json`, `font.json`, `rooms.json`,
`sounds.json`. Každý z nich čeká na svůj milník (M2–M6) a **žádný nevznikne
dřív, než bude co změřit**. Server je posílá jako `null` a aplikace to musí
přežít (`../db/appData.php`).
