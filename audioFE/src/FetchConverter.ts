import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import pkg from '../package.json';
import { assertIsDefined, fetish } from './helpers';
import SaxonJS from './saxon-js/SaxonJS3.rt';
import { ApiService } from './ApiService';

const XSL_TIMEMAP =
  'https://raw.githubusercontent.com/infojunkie/musicxml-midi/main/build/timemap.sef.json';

/**
 * Implementation of IMidiConverter that uses both local and remote API conversion capabilities.
 * For remote conversion, it uses the ApiService to convert files through the external API.
 */
export class FetchConverter implements IMidiConverter {
  protected _timemap?: MeasureTimemap;
  protected _midi?: IMidiFile;
  protected _progressEventSource?: EventSource;

  constructor(
    protected _midiOrUri: IMidiFile | string,
    protected _timemapOrUri?: MeasureTimemap | string,
    protected _useApi: boolean = false
  ) {}

  async initialize(musicXml: string): Promise<void> {
    if (this._useApi) {
      try {
        // Convert the XML string to a Blob
        const xmlBlob = new Blob([musicXml], { type: 'application/xml' });
        const xmlFile = new File([xmlBlob], 'score.xml', { type: 'application/xml' });
        
        // Start progress monitoring
        this._progressEventSource = ApiService.subscribeToProgress((status, message) => {
          console.log(`Conversion progress: ${status} - ${message}`);
        });

        // Convert using API
        const convertedBlob = await ApiService.convertFile(xmlFile);
        // Process the converted file...
        this._midi = await parseMidiBuffer(await convertedBlob.arrayBuffer());
        
        // Close the event source
        this._progressEventSource?.close();
      } catch (error) {
        console.error('API conversion failed:', error);
        // Fallback to local conversion
        await this._localInitialize(musicXml);
      }
    } else {
      await this._localInitialize(musicXml);
    }
  }

  protected async _localInitialize(musicXml: string): Promise<void> {
    this._midi =
      typeof this._midiOrUri === 'string'
        ? await parseMidiBuffer(
            await (await fetish(this._midiOrUri)).arrayBuffer(),
          )
        : this._midiOrUri;
    this._timemap =
      typeof this._timemapOrUri === 'undefined'
        ? await FetchConverter._parseTimemap(musicXml)
        : typeof this._timemapOrUri === 'string'
          ? <MeasureTimemap>await (await fetish(this._timemapOrUri)).json()
          : this._timemapOrUri;
  }

  get midi(): IMidiFile {
    assertIsDefined(this._midi);
    return this._midi;
  }

  get timemap(): MeasureTimemap {
    assertIsDefined(this._timemap);
    return this._timemap;
  }

  get version(): string {
    return `${pkg.name} v${pkg.version}`;
  }

  /**
   * Parse a MusicXML score into a timemap.
   */
  protected static async _parseTimemap(
    musicXml: string,
  ): Promise<MeasureTimemap> {
    try {
      const timemap = await SaxonJS.transform(
        {
          stylesheetLocation: XSL_TIMEMAP,
          sourceText: musicXml,
          destination: 'serialized',
          stylesheetParams: {
            useSef: true,
          },
        },
        'async',
      );
      return JSON.parse(timemap.principalResult);
    } catch (error) {
      console.warn(`[FetchConverter._parseTimemap] ${error}`);
    }
    return [];
  }
}
