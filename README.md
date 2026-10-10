# Happy Eck Kiosk

Statische Webseite für happyeck.de. Bestehende Inhalte, Bewerbungsseite, Bilder und Domain bleiben erhalten.

## Adminbereich

`/admin.html` enthält eine Supabase-Anmeldung und einen Editor für fünf Beschreibungstexte der Startseite. Jede Änderung wird einzeln gespeichert. Gleichzeitige Änderungen werden anhand von `updated_at` erkannt. Die Originaltexte in `index.html` bleiben sichtbar, wenn Supabase nicht konfiguriert oder nicht erreichbar ist. Bewerbungen werden weiterhin über das bisherige E-Mail-Verfahren versendet; es werden keine Bewerberdaten in dieser Datenbank gesammelt.

Die Admin-HTML-Datei selbst ist öffentlich abrufbar. Die geschützte Funktion ist das Bearbeiten der Daten: PostgreSQL Row Level Security erlaubt Änderungen ausschließlich Konten, die in `admin_users` freigeschaltet wurden. Eine Anmeldung allein verleiht keine Adminrechte. Es gibt keinen Registrierungsbutton und keine Möglichkeit, sich über die Webseite selbst Adminrechte zu geben.

## Aktuelle Verbindung

Projekt: `jhoueubxgwerbwxyfhml`, öffentliche Browserkonfiguration ist eingetragen. Die Textmigration wurde am 10.10.2026 angewendet. Der bereits vorhandene bestätigte Benutzer und dessen Admin-Mitgliedschaft werden verwendet; kein Passwort wurde verändert. Bestehende 29 Kategorien und die Produkttabelle bleiben erhalten. SQL-Rollentests bestätigen Eigentümer-Schreibzugriff, öffentliche Lesezugriffe und die Ablehnung fremder Änderungen sowie der Selbstfreischaltung.

## Supabase bei einer Neuinstallation aktivieren

1. Ein vorhandenes Supabase-Projekt auswählen. Bestehende Tabellen und Benutzer zuerst prüfen.
2. Die Migration `supabase/migrations/20261010202650_happy_eck_admin_content.sql` einmal anwenden. Sie ergänzt die Texttabelle, schützt die bestehende Admin-Mitgliedschaft und übernimmt die fünf aktuellen Texte. Die existierenden Katalogtabellen müssen vorhanden sein. Sie entzieht außerdem gefährliche TRUNCATE-/TRIGGER-/REFERENCES-Rechte und entfernt die ältere Produkt-Lesepolicy, welche ausgeblendete Kategorien nicht berücksichtigt. Nicht erneut auf bereits angelegte Tabellen anwenden.
3. Einen bestätigten Benutzer über Supabase Authentication anlegen oder ein bestehendes Eigentümerkonto auswählen. Öffentliche Neuregistrierungen in Authentication deaktivieren, wenn dieses Projekt ausschließlich der Administration dient. E-Mail/Passwort-Anmeldung aktivieren; Site URL auf `https://happyeck.de` setzen.
4. Ausschließlich den verifizierten Eigentümer freischalten, mit dessen tatsächlicher Auth-Benutzer-ID:

   ```sql
   insert into public.admin_users (user_id) values ('VERIFIZIERTE-AUTH-BENUTZER-ID');
   ```

5. In `supabase-config.js` die Projekt-URL und den **öffentlichen Publishable Key** eintragen. Ein Legacy-Key ist nur mit JWT-Rolle `anon` zulässig. Niemals Secret-, `service_role`-, Datenbankpasswörter oder Adminpasswörter im Repository speichern.
6. Live prüfen: öffentliche Inhalte lesbar; anonyme Änderungen abgelehnt; angemeldete Nicht-Admins können nicht ändern oder Rollen vergeben; freigeschalteter Admin kann speichern; Entzug der Mitgliedschaft sperrt weitere Änderungen; erneutes Laden der Startseite zeigt die gespeicherten Texte.

Solange die Konfiguration leer ist, bleibt die Startseite unverändert nutzbar und die Admin-Anmeldung deaktiviert.

## Sicherheit und Betrieb

- Auth-Tokens werden nur im `sessionStorage` des Admin-Tabs gespeichert, keine Passwörter. Abmelden entfernt die lokale Sitzung und versucht, die Supabase-Sitzung zu widerrufen.
- Der Adminbereich verwendet eine Content Security Policy ohne fremde Scripts oder Inline-Scripts.
- Inhalte werden als Text dargestellt, niemals als HTML ausgeführt.
- Browserrollen können nur lesen bzw. bestehende Textwerte ändern. Sie dürfen keine Mitgliedschaften, Schlüssel, Zeitstempel oder Zeilen anlegen/löschen.
- Die Verwaltung umfasst zunächst Beschreibungstexte. Bilder, Kontaktdaten, Überschriften und Bewerbungen bleiben im bisherigen Verfahren.
- Keine neue Hosting-Plattform nötig; das vorhandene GitHub-Pages-/Domain-Setup bleibt erhalten.

## Prüfungen

```sh
node --experimental-vm-modules --test tests/client.test.cjs
```

Die Tests prüfen Client-Verhalten mit simulierten API-Antworten. Live-Auth und Datenbankrichtlinien müssen zusätzlich am verbundenen Supabase-Projekt geprüft werden.

## Freigabestatus (10.10.2026)

- PR #1 bleibt offen; keine Veröffentlichung oder Zusammenführung freigegeben.
- Neun lokale Clienttests bestehen, einschließlich paralleler Token-Erneuerung und Abmelden während einer laufenden Erneuerung. Eine beendete Sitzung wird durch verspätete Antworten nicht wiederhergestellt.
- Alle Originaltexte, Bildverweise, Bewerbungsseite und Domain geprüft und erhalten. JavaScript-Syntax geprüft. Dynamische Inhalte verwenden Textdarstellung, kein `innerHTML`; im Browser liegt ausschließlich ein öffentlicher Schlüssel.
- Alle vier öffentlichen Tabellen haben RLS. Mitgliedschaften sind nur für den jeweiligen angemeldeten Benutzer lesbar; Browsernutzer können keine Admin-Mitgliedschaft vergeben. Änderungen der Textwerte benötigen eine bestehende Admin-Mitgliedschaft.
- GitHub Actions hat den Prüflauf nicht gestartet: „The job was not started because your account is locked due to a billing issue.“ Dies ist keine Testfehlermeldung. Der verbundene GitHub-Zugang kann keine persönlichen Abrechnungsdaten lesen oder ändern. Nach Aufhebung der Sperre muss der aktuelle PR-Prüflauf erfolgreich abgeschlossen werden.
- Supabase meldet weiterhin deaktivierten Schutz gegen bekannte geleakte Passwörter. Diese Funktion benötigt Pro oder höher. Kein kostenpflichtiges Upgrade wurde vorgenommen. Ein einzigartiges starkes Adminpasswort verwenden; keine Zugangsdaten im Chat oder Repository speichern.
- Die tatsächliche Browser-Anmeldung mit dem bestehenden Adminpasswort wurde noch nicht geprüft. Vor einer Veröffentlichung muss sie einschließlich Speichern/Abmelden in einer zugriffsbeschränkten Testumgebung geprüft werden.
- Der Adminbereich bearbeitet fünf Beschreibungstexte. Produkt-, Kategorie-, Bild- und Bewerbungsverwaltung sind nicht Bestandteil dieses PRs.
