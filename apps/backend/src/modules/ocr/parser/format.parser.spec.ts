import { FormatParser } from './format.parser';

describe('FormatParser', () => {
  let parser: FormatParser;

  beforeEach(() => {
    parser = new FormatParser();
  });

  describe('parse', () => {
    it('should parse a basic format', () => {
      const text = `
FECHA: 15/03/2026
1A 5 250.5 200.3 12000
1B 3 300.0 250.0 15000
JUMBO 500 100 400
EXTRA 300 50 250
A.A. 200 30 170
A 150 20 130
B 100 10 90
OBSERVACIONES
Todo normal
      `.trim();

      const result = parser.parse(text);

      expect(result.fecha).toBe('2026-03-15');
      expect(result.galpones.length).toBe(2);
      expect(result.galpones[0].codigo).toBe('1A');
      expect(result.galpones[0].mortalidad).toBe(5);
      expect(result.galpones[0].postura).toBe(12000);
      expect(result.tiposHuevo.length).toBeGreaterThan(0);
    });

    it('should handle different date formats', () => {
      const text1 = 'FECHA: 2026-03-15';
      expect(parser.parse(text1).fecha).toBe('2026-03-15');

      const text2 = 'FECHA: 15-03-2026';
      expect(parser.parse(text2).fecha).toBe('2026-03-15');

      const text3 = '15.03.26';
      expect(parser.parse(text3).fecha).toBe('2026-03-15');
    });

    it('should extract galpones with flexible patterns', () => {
      const text = 'GALPON 2A: 10 500 400 25000';
      const result = parser.parse(text);
      expect(result.galpones.length).toBe(1);
      expect(result.galpones[0].codigo).toBe('2A');
    });

    it('should extract egg types', () => {
      const text = 'JUMBO 1000 200 800';
      const result = parser.parse(text);
      expect(result.tiposHuevo.length).toBe(1);
      expect(result.tiposHuevo[0].codigo).toBe('JUMBO');
      expect(result.tiposHuevo[0].postura).toBe(1000);
    });

    it('should extract bandejas', () => {
      const text = 'BANDEJAS AA 100 50 200 150';
      const result = parser.parse(text);
      expect(result.inventarioBandejas.length).toBeGreaterThanOrEqual(1);
      expect(result.inventarioBandejas[0].tipo).toBe('AA');
    });

    it('should extract sacos', () => {
      const text = 'SACOS entrada 50 saldo 200';
      const result = parser.parse(text);
      expect(result.sacos).toBeTruthy();
    });

    it('should extract observaciones', () => {
      const text = 'OBSERVACIONES: Todo en orden hoy';
      const result = parser.parse(text);
      expect(result.observaciones).toContain('Todo en orden');
    });

    it('should handle empty text', () => {
      const result = parser.parse('');
      expect(result.fecha).toBeNull();
      expect(result.galpones).toEqual([]);
    });

    it('should normalize OCR artifacts', () => {
      const text = '1A 5 250,5 200.3 12000';
      const result = parser.parse(text);
      expect(result.galpones.length).toBe(1);
    });
  });
});
