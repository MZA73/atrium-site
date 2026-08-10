// Generateur de bail multi-fonction - coeur partage (Node test + navigateur).
// generateBail(doc, d) : doc = instance jsPDF ; d = donnees (selecteurs + champs).
function buildBail(jsPDF, d){
const doc=new jsPDF({unit:'mm',format:'a4'});
if(d._cursiveTTF){try{doc.addFileToVFS('Sig.ttf',d._cursiveTTF);doc.addFont('Sig.ttf','SigScript','normal');}catch(e){}}
const PDF_W=210,PDF_H=297,MARGIN_L=25,MARGIN_R=25,CONTENT_W=PDF_W-MARGIN_L-MARGIN_R,TOP_Y=35,BOTTOM_Y=PDF_H-28;
const C_NOIR=[13,13,13],C_OR=[201,169,97],C_OR_ECLAT=[245,230,184],C_OR_SOMBRE=[139,115,64],C_BLANC=[248,245,238],C_GRIS=[55,55,55],C_LABEL=[110,90,55],C_FILI=[205,195,170];
const REF=(d.reference||'MODELE');
function g(k,lab){var v=d[k];return (v&&String(v).trim())?String(v):('<'+(lab||k.toUpperCase())+'>');}
function bg(){doc.setFillColor.apply(doc,C_BLANC);doc.rect(0,0,PDF_W,PDF_H,'F');}
function sides(){doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.4);doc.line(6,15,6,PDF_H-15);doc.line(PDF_W-6,15,PDF_W-6,PDF_H-15);doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.15);doc.line(8,15,8,PDF_H-15);doc.line(PDF_W-8,15,PDF_W-8,PDF_H-15);doc.setFillColor.apply(doc,C_OR);[[6,15],[PDF_W-6,15],[6,PDF_H-15],[PDF_W-6,PDF_H-15]].forEach(function(a){doc.triangle(a[0]-1.5,a[1],a[0],a[1]-1.5,a[0]+1.5,a[1],'F');doc.triangle(a[0]-1.5,a[1],a[0],a[1]+1.5,a[0]+1.5,a[1],'F');});doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.3);doc.line(15,15,PDF_W-15,15);doc.line(15,PDF_H-15,PDF_W-15,PDF_H-15);}
function rosace(cx,cy,s){doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.25);for(var i=0;i<4;i++){var a=i*Math.PI/2;doc.line(cx+Math.cos(a)*s*0.52,cy+Math.sin(a)*s*0.52,cx+Math.cos(a)*s,cy+Math.sin(a)*s);}doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.15);for(var i=0;i<4;i++){var a=i*Math.PI/2+Math.PI/4;doc.line(cx+Math.cos(a)*s*0.52,cy+Math.sin(a)*s*0.52,cx+Math.cos(a)*s*0.86,cy+Math.sin(a)*s*0.86);}for(var j=0;j<4;j++){var b=j*Math.PI/2,lx=cx+Math.cos(b)*s,ly=cy+Math.sin(b)*s;doc.setFillColor.apply(doc,C_OR);doc.triangle(lx-1.1,ly,lx,ly-1.4,lx+1.1,ly,'F');doc.triangle(lx-1.1,ly,lx,ly+1.4,lx+1.1,ly,'F');}doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.18);doc.circle(cx,cy,s+2.6,'S');doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.12);doc.circle(cx,cy,s*0.5,'S');doc.setFillColor.apply(doc,C_OR);doc.triangle(cx-1.5,cy,cx,cy-1.5,cx+1.5,cy,'F');doc.triangle(cx-1.5,cy,cx,cy+1.5,cx+1.5,cy,'F');}
function seal(cx,cy,r){doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.5);doc.circle(cx,cy,r,'S');doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.16);doc.circle(cx,cy,r-1.3,'S');doc.setLineWidth(0.11);doc.circle(cx,cy,r-2.5,'S');for(var k=0;k<4;k++){var a=k*Math.PI/2,px=cx+Math.cos(a)*(r-0.65),py=cy+Math.sin(a)*(r-0.65);doc.setFillColor.apply(doc,C_OR);doc.triangle(px-0.8,py,px,py-0.8,px+0.8,py,'F');doc.triangle(px-0.8,py,px,py+0.8,px+0.8,py,'F');}doc.setTextColor.apply(doc,C_OR);doc.setFont('times','normal');doc.setFontSize(r*0.92);doc.text('T',cx,cy+r*0.33,{align:'center'});doc.setFillColor.apply(doc,C_OR_SOMBRE);doc.triangle(cx-0.9,cy-r*0.5,cx,cy-r*0.5-0.9,cx+0.9,cy-r*0.5,'F');doc.triangle(cx-0.9,cy-r*0.5,cx,cy-r*0.5+0.9,cx+0.9,cy-r*0.5,'F');}
function headIn(){doc.setFillColor.apply(doc,C_OR);doc.triangle(PDF_W/2-1.8,22,PDF_W/2,20.4,PDF_W/2+1.8,22,'F');doc.triangle(PDF_W/2-1.8,22,PDF_W/2,23.6,PDF_W/2+1.8,22,'F');doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(8);doc.text('Bail d\'Habitation - '+REF,PDF_W/2,27,{align:'center'});doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.15);doc.line(MARGIN_L,30,PDF_W-MARGIN_R,30);}
function toRoman(n){var l=[['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];var r='';for(var i=0;i<l.length;i++){while(n>=l[i][1]){r+=l[i][0];n-=l[i][1];}}return r.split('').join(' ');}
function footIn(p){var fy=PDF_H-22;doc.setFillColor.apply(doc,C_OR);doc.triangle(PDF_W/2-1.2,fy,PDF_W/2,fy-1,PDF_W/2+1.2,fy,'F');doc.triangle(PDF_W/2-1.2,fy,PDF_W/2,fy+1,PDF_W/2+1.2,fy,'F');doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(8);doc.text('Bail d\'Habitation',PDF_W/2-35,fy+0.5,{align:'center'});doc.setFont('times','normal');doc.text('-  '+toRoman(p)+'  -',PDF_W/2+35,fy+0.5,{align:'center'});}
function _drawParaphes(doc,loc,cab){var yb=PDF_H-24.3,xr=PDF_W-MARGIN_R;doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.12);doc.line(xr-42,yb+0.6,xr,yb+0.6);doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(5.4);doc.text('Paraphes',xr-42,yb-1.4);doc.setTextColor(23,53,110);try{doc.setFont('SigScript','normal');}catch(e){doc.setFont('times','italic');}doc.setFontSize(12);doc.text(loc,xr-26,yb,{align:'center'});doc.text(cab,xr-9,yb,{align:'center'});doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(4.2);doc.text('Loc.',xr-26,yb+2.6,{align:'center'});doc.text('Cab.',xr-9,yb+2.6,{align:'center'});}
function newPage(){doc.addPage();bg();sides();headIn();return TOP_Y+7;}
function chk(y,need){if(y+(need||10)>BOTTOM_Y)return newPage();return y;}
function artTitle(y,rn,titre){y=chk(y,35);doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(10);doc.text('Article',PDF_W/2,y,{align:'center'});doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(20);doc.text(rn,PDF_W/2,y+9,{align:'center'});doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.3);doc.line(PDF_W/2-12,y+12,PDF_W/2-3,y+12);doc.line(PDF_W/2+3,y+12,PDF_W/2+12,y+12);doc.setFillColor.apply(doc,C_OR);doc.triangle(PDF_W/2-1.5,y+12,PDF_W/2,y+10.8,PDF_W/2+1.5,y+12,'F');doc.triangle(PDF_W/2-1.5,y+12,PDF_W/2,y+13.2,PDF_W/2+1.5,y+12,'F');doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(13);doc.text(titre.split('').join(' '),PDF_W/2,y+20,{align:'center'});return y+28;}
function para(y,text,o){o=o||{};var size=o.size||10.5,lh=o.lh||5.2,style=o.style||'normal',color=o.color||C_GRIS,align=o.align||'left';doc.setTextColor.apply(doc,color);doc.setFont('times',style);doc.setFontSize(size);var lines=doc.splitTextToSize(text,CONTENT_W);for(var i=0;i<lines.length;i++){y=chk(y,lh);if(align==='center')doc.text(lines[i],PDF_W/2,y,{align:'center'});else doc.text(lines[i],MARGIN_L,y);y+=lh;}return y;}
function fieldTable(y,rows){if(!rows.length)return y;y=chk(y,rows.length*7+4);doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.15);doc.line(MARGIN_L,y,PDF_W-MARGIN_R,y);for(var i=0;i<rows.length;i++){y=chk(y+6.5,4);doc.setTextColor.apply(doc,C_LABEL);doc.setFont('times','italic');doc.setFontSize(9.5);doc.text(rows[i][0],MARGIN_L+2,y);doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(10.5);var vl=doc.splitTextToSize(String(rows[i][1]),CONTENT_W-60);doc.text(vl[0],MARGIN_L+55,y);for(var k=1;k<vl.length;k++){y+=4.5;y=chk(y,4);doc.text(vl[k],MARGIN_L+55,y);}doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.1);doc.line(MARGIN_L,y+1.5,PDF_W-MARGIN_R,y+1.5);}return y+5;}
function legalBox(y,label,text,ap){doc.setFont('times','normal');doc.setFontSize(ap?10:9.5);var lines=doc.splitTextToSize(text,CONTENT_W-16);var boxH=8+lines.length*4.6+6;y=chk(y+4,boxH+4);doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(ap?0.6:0.4);doc.line(MARGIN_L,y,PDF_W-MARGIN_R,y);doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.15);doc.line(MARGIN_L,y+1.2,PDF_W-MARGIN_R,y+1.2);y+=7;doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(ap?10:9);doc.text(label.toUpperCase(),PDF_W/2,y,{align:'center'});y+=5;doc.setTextColor.apply(doc,ap?C_NOIR:C_GRIS);doc.setFont('times',ap?'bold':'normal');doc.setFontSize(ap?10:9.5);for(var i=0;i<lines.length;i++){y=chk(y,4.6);doc.text(lines[i],PDF_W/2,y,{align:'center'});y+=4.6;}y+=2;doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(ap?0.6:0.4);doc.line(MARGIN_L,y,PDF_W-MARGIN_R,y);doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.15);doc.line(MARGIN_L,y+1.2,PDF_W-MARGIN_R,y+1.2);return y+7;}
function bullet(y,text){y=chk(y,4.8);doc.setFillColor.apply(doc,C_OR);doc.triangle(MARGIN_L+1,y-1.2,MARGIN_L+2,y-2.2,MARGIN_L+3,y-1.2,'F');doc.triangle(MARGIN_L+1,y-1.2,MARGIN_L+2,y-0.2,MARGIN_L+3,y-1.2,'F');doc.setTextColor.apply(doc,C_GRIS);doc.setFont('times','normal');doc.setFontSize(10);var lines=doc.splitTextToSize(text,CONTENT_W-8);for(var i=0;i<lines.length;i++){if(i>0)y=chk(y,4.8);doc.text(lines[i],MARGIN_L+7,y);y+=4.8;}return y;}
function sep(y){doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.2);doc.line(PDF_W/2-25,y,PDF_W/2-5,y);doc.line(PDF_W/2+5,y,PDF_W/2+25,y);doc.setFillColor.apply(doc,C_OR);doc.triangle(PDF_W/2-2,y,PDF_W/2,y-1.5,PDF_W/2+2,y,'F');doc.triangle(PDF_W/2-2,y,PDF_W/2,y+1.5,PDF_W/2+2,y,'F');return y+8;}
function _drawTampon(doc,cx,cy){var W=45,H=19,x0=cx-W/2,y0=cy-H/2;var INK=[47,42,38];doc.setDrawColor(INK[0],INK[1],INK[2]);doc.setLineWidth(0.7);doc.rect(x0,y0,W,H,'S');doc.setLineWidth(0.25);doc.rect(x0+1.2,y0+1.2,W-2.4,H-2.4,'S');doc.setTextColor(INK[0],INK[1],INK[2]);doc.setFont('helvetica','bold');doc.setFontSize(6.1);doc.text("LE TEMPLE DE L'IMMOBILIER",cx,y0+4.3,{align:'center'});doc.setLineWidth(0.18);doc.line(x0+5,y0+5.5,x0+W-5,y0+5.5);doc.setFont('helvetica','normal');doc.setFontSize(4.5);var L=['Cabinet de gestion - marque ATRIUM','10 rue Saint-Jacques - 59500 DOUAI','CPI 5904 2025 000 000 004 (T + G)','Garantie fin. MARKEL 110 000 EUR','SIREN 490 000 536 - RCS Douai'];for(var i=0;i<L.length;i++){doc.text(L[i],cx,y0+7.7+i*2.45,{align:'center'});}}
function cartouche(x,y,w,h,o){doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.5);doc.rect(x,y,w,h,'S');doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.15);doc.rect(x+1.5,y+1.5,w-3,h-3,'S');doc.setFillColor.apply(doc,C_NOIR);doc.rect(x+1.5,y+1.5,w-3,11,'F');doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.2);doc.line(x+4,y+11,x+w-4,y+11);doc.setTextColor.apply(doc,C_OR_ECLAT);doc.setFont('times','normal');doc.setFontSize(9.5);doc.text(o.titre,x+w/2,y+7.5,{align:'center'});doc.setFont('times','italic');doc.setFontSize(7);doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.text(o.sous,x+w/2,y+10,{align:'center'});doc.setTextColor.apply(doc,C_FILI);doc.setFont('times','italic');doc.setFontSize(9);(o.fil||[]).forEach(function(l,i){doc.text(l,x+w/2,y+24+i*4.6,{align:'center'});});
if(o.stamp){_drawTampon(doc,x+w/2,y+22);}
if(o.signImg){try{doc.addImage(o.signImg,'PNG',x+w/2-13,y+15,26,17.4);}catch(e){}}
if(o.signName){doc.setTextColor(23,53,110);try{doc.setFont('SigScript','normal');}catch(e){doc.setFont('times','italic');}var _fs=28;doc.setFontSize(_fs);var _mw=w-11;while(doc.getTextWidth(o.signName)>_mw&&_fs>11){_fs-=1;doc.setFontSize(_fs);}doc.text(o.signName,x+w/2,y+24.5,{align:'center'});}doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.2);doc.line(x+6,y+h-15,x+w-6,y+h-15);doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(9.5);doc.text(o.nom||'',x+w/2,y+h-9,{align:'center'});doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(8);doc.text(o.qual||'',x+w/2,y+h-4.5,{align:'center'});}

var reg=d.regime||'nu', prof=d.profil||'seul', gar=d.garantie||'caution', zone=d.zone||'non', dpe=d.dpe||'ok';
var cautions=(d.cautions&&d.cautions.length)?d.cautions:(d.caution_nom?[{nom:d.caution_nom,plafond:d.caution_plafond,revenus:d.caution_revenus,naissance:d.caution_naissance,adresse:d.caution_adresse,duree:d.caution_duree}]:[]);
var isMeuble=(reg!=='nu');

// COVER
bg();sides();
doc.setFillColor.apply(doc,C_NOIR);doc.rect(MARGIN_L-2,15,CONTENT_W+4,33,'F');
doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.3);doc.rect(MARGIN_L+1,18,CONTENT_W-2,27,'S');
doc.setTextColor.apply(doc,C_OR_ECLAT);doc.setFont('times','normal');doc.setFontSize(18);doc.text('L E   T E M P L E   D E   L \' I M M O B I L I E R',PDF_W/2,28,{align:'center'});
doc.setTextColor.apply(doc,C_FILI);doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.text('M A I S O N   F O N D E E   E N   M M V I   -   D O U A I',PDF_W/2,34,{align:'center'});
doc.setFillColor.apply(doc,C_OR);doc.triangle(PDF_W/2-1.5,37.5,PDF_W/2,36,PDF_W/2+1.5,37.5,'F');doc.triangle(PDF_W/2-1.5,37.5,PDF_W/2,39,PDF_W/2+1.5,37.5,'F');
doc.setTextColor.apply(doc,C_FILI);doc.setFont('helvetica','normal');doc.setFontSize(6);doc.text('Mandataire en transactions et gestion immobilieres - CPI 5904 2025 000 000 004',PDF_W/2,43,{align:'center'});
doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.6);doc.line(PDF_W/2-35,88,PDF_W/2+35,88);doc.setDrawColor.apply(doc,C_OR_SOMBRE);doc.setLineWidth(0.2);doc.line(PDF_W/2-28,90,PDF_W/2+28,90);
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(11);doc.text('A C T E   S O U S   S E I N G   P R I V E',PDF_W/2,100,{align:'center'});
doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(46);doc.text('B A I L',PDF_W/2,124,{align:'center'});
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(20);doc.text('d\'Habitation',PDF_W/2,138,{align:'center'});
rosace(PDF_W/2,158,10);
var qualLabel={nu:'LOCATION NUE',meuble:'LOCATION MEUBLEE',etudiant:'BAIL ETUDIANT',mobilite:'BAIL MOBILITE'}[reg]||'BAIL';
doc.setFillColor.apply(doc,C_NOIR);doc.rect(PDF_W/2-45,176,90,11,'F');doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.25);doc.rect(PDF_W/2-42,178.5,84,6,'S');
doc.setTextColor.apply(doc,C_OR_ECLAT);doc.setFont('times','normal');doc.setFontSize(12);doc.text(qualLabel.split('').join(' '),PDF_W/2,183.5,{align:'center'});
doc.setDrawColor.apply(doc,C_OR);doc.setLineWidth(0.4);doc.line(PDF_W/2-30,196,PDF_W/2+30,196);
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(9);doc.text('Reference du bail',PDF_W/2,214,{align:'center'});
doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(15);doc.text(g('reference','REFERENCE'),PDF_W/2,221,{align:'center'});
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(9);doc.text('Fait a Douai, le',PDF_W/2,236,{align:'center'});
doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(12);doc.text(g('date','DATE'),PDF_W/2,242,{align:'center'});
seal(PDF_W-30,PDF_H-35,10);
doc.setTextColor.apply(doc,C_GRIS);doc.setFont('helvetica','normal');doc.setFontSize(6);
doc.text('SARLU LE TEMPLE DE L\'IMMOBILIER - 10 rue Saint-Jacques, 59500 Douai',MARGIN_L,PDF_H-34);
doc.text('SARLU au capital de 10 000 EUR - SIREN 490 000 536 - RCS Douai - APE 6831Z - TVA FR85 490 000 536',MARGIN_L,PDF_H-31);
doc.text('Carte CPI 5904 2025 000 000 004 (mentions T + G) - Garantie financiere et RCP MARKEL INSURANCE SE 110 000 EUR',MARGIN_L,PDF_H-28);

// PREAMBULE
var y=newPage();
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(11);doc.text('Preambule',PDF_W/2,y,{align:'center'});y+=7;
doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(14);doc.text('E N T R E   L E S   S O U S S I G N E S',PDF_W/2,y,{align:'center'});y+=8;
y=para(y,"D'une part, LE BAILLEUR : "+g('bailleur_nom','NOM')+" ("+g('bailleur_qualite','PP/SCI/PM')+"), demeurant / sis "+g('bailleur_adresse','ADRESSE')+", courriel "+g('bailleur_email','EMAIL')+", tel. "+g('bailleur_tel','TEL')+" ; ci-apres \"le Bailleur\".",{lh:5});y+=1;
if(prof==='morale'){
  y=para(y,"D'autre part, LE LOCATAIRE (personne morale) : "+g('loc_denom','DENOMINATION')+", "+g('loc_forme','FORME')+" au capital de "+g('loc_capital','CAPITAL')+" EUR, RCS "+g('loc_rcs','RCS')+", siege "+g('loc_siege','SIEGE')+", representee par "+g('loc_repr','REPRESENTANT')+", en qualite de "+g('loc_qualrepr','QUALITE')+" ; Kbis de moins de trois mois annexe. Occupant designe : "+g('loc_occupant','OCCUPANT')+".",{lh:5});
  y=legalBox(y,"Vigilance - preneur personne morale","Le bail d'habitation en residence principale suppose un occupant personne physique. Preneur personne morale : le contrat peut relever du droit commun (art. 1709 s. C. civ.) ou etre requalifie selon l'occupation reelle. Qualifier expressement le regime et l'occupant.",false);
}else if(prof==='coloc'){
  y=para(y,"D'autre part, LES COLOCATAIRES (solidaires - art. 8-1 loi 89-462) : "+g('locataire','NOMS ET PROFILS DES COLOCATAIRES')+" ; ci-apres ensemble \"le Locataire\".",{lh:5});
}else{
  y=para(y,"D'autre part, LE LOCATAIRE : "+g('locataire','NOM, NAISSANCE, PROFESSION, CONTRAT, REVENUS, CNI, EMAIL, TEL')+" ; ci-apres \"le Locataire\".",{lh:5});
}
y=para(y,"PAR L'INTERMEDIAIRE DE la SARLU LE TEMPLE DE L'IMMOBILIER (marque ATRIUM), 10 rue Saint-Jacques, 59500 Douai - carte CPI 5904 2025 000 000 004 (CCI Grand Lille, mentions Transactions et Gestion immobiliere), SIREN 490 000 536, RCS Douai, TVA FR85 490 000 536, garantie financiere et RCP MARKEL INSURANCE SE 110 000 EUR, cabinet habilite a detenir des fonds, mediateur GIE MEDIMMOCONSO - representee par M. Mohammed ZAZOUA, Gerant, mandat de gestion n. "+g('num_mandat','N. MANDAT')+".",{lh:5,style:'italic',color:C_OR_SOMBRE,size:9.5});y+=1;
y=para(y,"Le Bailleur et le Locataire (\"les Parties\") sont convenus du present bail d'habitation, soumis a la loi n. 89-462 du 6 juillet 1989 et au decret n. 2015-587.",{style:'italic'});

// I DESIGNATION
y=artTitle(y,'I','DESIGNATION DU LOGEMENT');
y=fieldTable(y,[["Adresse",g('bien_adresse','ADRESSE')],["Type de logement",g('bien_type','TYPE')],["Surface habitable (loi Boutin)",g('bien_surface','SURFACE')+" m2"],["Pieces principales",g('bien_pieces','N')],["Dont chambres",g('bien_chambres','N')],["Annee de construction",g('bien_annee','ANNEE')],["Reference cadastrale",g('bien_cadastre','SECTION/PARCELLE')],["Chauffage",g('bien_chauffage','MODE')],["Eau chaude",g('bien_eauchaude','MODE')],["Equipements et dependances",g('bien_equip','...')],["Destination","Residence principale exclusive"]]);
y=sep(y);
// II DUREE (selon regime)
y=artTitle(y,'II','DUREE DU BAIL');
if(reg==='nu')y=para(y,"Conforme a l'article 10 de la loi du 6 juillet 1989, le bail est conclu pour une duree de 3 ans (6 ans si le Bailleur est une personne morale), prenant effet le "+g('date_effet','DATE')+" et expirant le "+g('date_fin','DATE')+", renouvelable par tacite reconduction (art. 12 et 15 loi 89-462).");
else if(reg==='meuble')y=para(y,"Le bail est conclu pour une duree de 1 an, a compter du "+g('date_effet','DATE')+", renouvelable par tacite reconduction.");
else if(reg==='etudiant')y=para(y,"Le bail est conclu pour une duree de 9 mois, a compter du "+g('date_effet','DATE')+", sans reconduction tacite ; il prend fin de plein droit au terme.");
else y=para(y,"Le bail mobilite (loi ELAN) est conclu pour "+g('duree_mob','1 A 10')+" mois, a compter du "+g('date_effet','DATE')+", non renouvelable et non reconductible. Le Locataire justifie d'un motif de mobilite (formation, etudes superieures, stage, apprentissage, mission temporaire, mutation), justificatif annexe.");
y=sep(y);
// III LOYER
y=artTitle(y,'III','LOYER ET CHARGES');
y=fieldTable(y,[["Loyer mensuel hors charges",g('loyer','MONTANT')+" EUR"],["Jour d'echeance","Le "+g('jour','JOUR')+" de chaque mois"],["Premier paiement",g('premier','DATE')],["Mode de paiement",g('mode_paiement','VIREMENT')]]);
if(reg==='mobilite')y=para(y,"Charges : forfait de "+g('charges','MONTANT')+" EUR par mois, sans regularisation.");
else y=para(y,"Charges : provision de "+g('charges','MONTANT')+" EUR par mois, regularisee annuellement sur justificatifs (decret 87-713).");
if(zone==='encadree')y=para(y,"Encadrement : loyer de reference "+g('loyer_ref','...')+" EUR, majore "+g('loyer_maj','...')+" EUR, complement "+g('complement','...')+" EUR justifie par "+g('motif_compl','MOTIF')+". Dernier loyer du precedent locataire (art. 3-1) : "+g('dernier_loyer','MONTANT/SANS OBJET')+".");
y=sep(y);
// IV REVISION
y=artTitle(y,'IV','REVISION ANNUELLE DU LOYER');
y=para(y,"Le loyer est revise chaque annee, sur la base de l'Indice de Reference des Loyers (IRL, INSEE), indice de reference "+g('irl','TRIMESTRE/VALEUR')+". Formule : loyer revise = loyer initial x (IRL nouveau / IRL initial), plafonnee a la variation de l'IRL. Revision non demandee dans l'annee = perdue.");
if(dpe==='fg')y=para(y,"Le logement etant classe "+g('dpe_classe','F/G')+", la revision est gelee et le calendrier d'interdiction des passoires energetiques s'applique (loi Climat 2021).");
y=sep(y);
// V DEPOT
y=artTitle(y,'V','DEPOT DE GARANTIE');
if(reg==='nu')y=para(y,"Depot de garantie de "+g('depot','MONTANT')+" EUR, egal a un (1) mois de loyer hors charges, verse a la signature (art. 22 loi 89-462).");
else if(reg==='mobilite')y=para(y,"Aucun depot de garantie ne peut etre exige (interdit en bail mobilite).");
else y=para(y,"Depot de garantie de "+g('depot','MONTANT')+" EUR, egal a deux (2) mois de loyer hors charges.");
if(reg!=='mobilite')y=para(y,"Restitution dans un delai d'un (1) mois (etat des lieux conforme) ou deux (2) mois (degradations), deduction faite des sommes dues ; majoration de 10 % du loyer par mois de retard.",{size:9.5});
y=sep(y);
// VI GARANTIE
y=artTitle(y,'VI','GARANTIE DE PAIEMENT');
if(gar==='caution'){var cn=cautions.length?cautions.map(function(c){return (c.nom||'<CAUTION>')+' ('+(c.plafond||'<PLAFOND>')+' EUR)';}).join(' ; '):'<CAUTION(S)>';y=para(y,"Le paiement est garanti par le(s) cautionnement(s) solidaire(s) de : "+cn+". Chaque caution appose la mention manuscrite de l'article 2297 du Code civil, a peine de nullite. Autant d'actes de cautionnement que de cautions sont annexes (voir modules).");}
else if(gar==='visale')y=para(y,"Le paiement est garanti par le dispositif VISALE (Action Logement), visa n. "+g('visa','N. VISA')+".");
else if(gar==='gli')y=para(y,"Le Bailleur a souscrit une assurance loyers impayes (GLI), contrat "+g('gli','ASSUREUR/N.')+". Cumul GLI et caution personne physique exclu, sauf etudiant/apprenti.");
else y=para(y,"Le present bail est consenti sans garantie de paiement particuliere.");
y=sep(y);
// VII EDL
y=artTitle(y,'VII','ETAT DES LIEUX');
y=para(y,"Un etat des lieux d'entree contradictoire est etabli le "+g('date_edl','DATE')+" (decret du 30 mars 2016) ; releves de compteurs et remise des cles le meme jour. Le Locataire dispose de dix (10) jours pour le completer. Un etat des lieux de sortie est etabli a la restitution.");
y=sep(y);
// VIII DDT
y=artTitle(y,'VIII','DOSSIER DE DIAGNOSTIC TECHNIQUE');
y=para(y,"Conformement aux articles L271-4 et suivants du CCH, sont annexes : DPE classe "+g('dpe_classe','...')+" ("+g('dpe_conso','...')+" kWh/m2/an), GES, etat des risques (ERP < 6 mois), CREP (avant 1949), amiante, electricite et gaz (installations > 15 ans) le cas echeant. Couts annuels d'energie estimes : "+g('cout_energie','...')+" EUR/an.");
y=sep(y);
// IX/X obligations
y=artTitle(y,'IX','OBLIGATIONS DU BAILLEUR');
["Delivrer un logement decent (decret 2002-120), exempt de risques, repondant a la performance energetique minimale.","Assurer la jouissance paisible et garantir les vices (art. 1719 C. civ.).","Entretenir les locaux et faire les reparations autres que locatives.","Souscrire une assurance Proprietaire Non-Occupant (PNO) et en justifier sur demande.","Restituer le depot de garantie dans le delai legal ; delivrer gratuitement quittance (art. 21)."].forEach(function(b){y=bullet(y,b);});
y=sep(y);
y=artTitle(y,'X','OBLIGATIONS DU LOCATAIRE');
["Payer le loyer et les charges aux termes convenus.","User paisiblement des locaux suivant leur destination.","Repondre des degradations, sauf vetuste, malfacon, force majeure ou fait d'un tiers.","Assurer l'entretien courant et les reparations locatives (decret 87-712 ; art. XIX).","Souscrire une assurance risques locatifs et en justifier chaque annee.","Ne ceder ni sous-louer sans accord ecrit (art. 8)."].forEach(function(b){y=bullet(y,b);});
if(isMeuble)y=para(y,"Le logement etant loue meuble, le Locataire jouit du mobilier inventorie (annexe, decret 2015-981) et le restitue en l'etat, usure normale exceptee.");
y=sep(y);
// XI clause resolutoire (blindee)
y=artTitle(y,'XI','CLAUSE RESOLUTOIRE');
y=legalBox(y,"Clause resolutoire expresse","Le present bail sera resilie de plein droit, sans formalite judiciaire prealable : (1) defaut de paiement du loyer, des charges ou du depot de garantie, deux mois apres commandement de payer infructueux (art. 24 loi 89-462) ; (2) defaut d'assurance un mois apres mise en demeure ; (3) troubles de voisinage ou non-respect de l'obligation d'user paisiblement des locaux, constates par une decision de justice passee en force de chose jugee.",true);
y=para(y,"Interets de retard au taux legal a compter de la mise en demeure. Frais de commandement et actes de commissaire de justice a la charge du Locataire dans les conditions et limites prevues par la loi (art. 24). Imputation des paiements partiels : frais, interets, charges, puis loyer en principal (art. 1342-10 C. civ.).");
y=sep(y);
// XII droit de visite
y=artTitle(y,'XII','DROIT DE VISITE ET INSPECTION ANNUELLE');
y=para(y,"Sur preavis ecrit de sept (7) jours ouvres, le Locataire permet l'acces au logement pour verification annuelle, controle de l'usage et reparations, visites de candidats en cas de vente ou de fin de bail, dans le respect de sa vie privee (art. 9 C. civ.), hors jours feries et dans la limite de deux heures les jours ouvrables.");
y=sep(y);
// XIII clauses particulieres + solidarite conditionnelle
y=artTitle(y,'XIII','CLAUSES PARTICULIERES');
y=para(y,"Animaux : la detention d'un animal familier ne peut etre interdite (loi 70-598). Sous-location et cession : interdites sauf accord ecrit prealable (art. 8). Assurance habitation obligatoire (art. 7 g), justification annuelle.");
if(prof==='coloc')y=legalBox(y,"Solidarite des colocataires","Conformement a l'article 8-1 de la loi 89-462, les colocataires sont tenus solidairement et indivisiblement. La solidarite prend fin lorsqu'un nouveau colocataire figure au bail ou, a defaut, au plus tard six mois apres la date d'effet du conge.",true);
if(reg==='mobilite')y=para(y,"La clause de solidarite entre colocataires est reputee non ecrite en bail mobilite.");
y=sep(y);
// XIV honoraires
y=artTitle(y,'XIV','HONORAIRES D\'AGENCE');
y=fieldTable(y,[["A la charge du Locataire - entremise",g('hono_loc','MONTANT')+" EUR TTC"],["A la charge du Locataire - etat des lieux",g('hono_loc_edl','MONTANT')+" EUR TTC"],["A la charge du Bailleur - entremise",g('hono_bail','MONTANT')+" EUR TTC"],["A la charge du Bailleur - etat des lieux",g('hono_bail_edl','MONTANT')+" EUR TTC"]]);
y=para(y,"Plafonds ALUR applicables. Conformement a l'article 5-I de la loi 89-462, les honoraires a la charge du Bailleur sont au moins egaux a ceux a la charge du Locataire.");
y=sep(y);
// XV conges
y=artTitle(y,'XV','RESILIATION ET CONGES');
if(reg==='meuble'||reg==='etudiant'||reg==='mobilite')y=para(y,"Conge du Locataire : preavis d'un (1) mois. Conge du Bailleur (hors mobilite) : trois (3) mois avant l'echeance, motive. En bail mobilite, le Bailleur ne peut donner conge avant le terme.");
else y=para(y,"Conge du Locataire (art. 15-I) : preavis de trois (3) mois, reduit a un (1) mois en zone tendue ou pour motif legal. Conge du Bailleur (art. 15-II) : preavis de six (6) mois, pour vente, reprise ou motif legitime et serieux ; locataires ages proteges (art. 15-III). Forme : LRAR, acte de commissaire de justice, ou remise en main propre contre recepisse.");
y=sep(y);
// XVI RGPD
y=artTitle(y,'XVI','PROTECTION DES DONNEES (RGPD)');
y=para(y,"Responsable : SARLU LE TEMPLE DE L'IMMOBILIER. Finalites : execution du bail, gestion locative, recouvrement, comptabilite, archivage. Base legale : execution du contrat et obligation legale. Conservation : duree du bail + 10 ans (art. 2224 C. civ.). Droits d'acces, rectification, effacement, opposition, portabilite ; reclamation CNIL - contact@templeimmo.com.");
y=sep(y);
// XVII notifications
y=artTitle(y,'XVII','NOTIFICATIONS ELECTRONIQUES');
y=para(y,"Les communications peuvent etre adressees par courriel ou lettre recommandee electronique (eIDAS, UE 910/2014).");
y=legalBox(y,"Actes a effets majeurs","Les actes a effets juridiques majeurs - conge, mise en demeure, mise en oeuvre de la clause resolutoire - requierent une LRAR papier ou un acte de commissaire de justice, non un simple courriel.",true);
y=sep(y);
// XVIII regularisation
y=artTitle(y,'XVIII','REGULARISATION DES CHARGES');
y=para(y,"Les provisions font l'objet d'une regularisation annuelle (art. 23) : decompte communique un mois avant, justificatifs a disposition six mois, contestation possible un mois ; trop-percu restitue, complement exigible.");
y=sep(y);
// XIX reparations
y=artTitle(y,'XIX','REPARATIONS LOCATIVES');
y=para(y,"A la charge du Locataire (decret 87-712) : entretien des jardins, gouttieres et evacuations ; elements de fermeture ; graissage et remplacement des poignees, clenches, vitres ; menus raccords de peinture, entretien des sols ; degorgement des canalisations, remplacement des joints, fusibles, ampoules ; entretien annuel de la chaudiere par un professionnel agree (decret 2009-649), ramonage, entretien de la VMC. Sont exclues les reparations dues a vetuste, malfacon, vice de construction ou force majeure (art. 1755 C. civ.).");
y=sep(y);
// XX vetuste
y=artTitle(y,'XX','GRILLE DE VETUSTE');
y=para(y,"Les Parties se referent, a l'etat des lieux de sortie, a la grille de vetuste de l'Institut National de la Consommation (art. 21-1). Les retenues sur depot sont calculees au prorata de la vetuste constatee.");
y=sep(y);
// XXI mediation
y=artTitle(y,'XXI','MEDIATION ET COMPETENCE');
y=para(y,"Mediateur de la consommation : GIE MEDIMMOCONSO - Me LARUELLE Anne, 1 Allee du Parc Messemena, 44500 La Baule (medimmoconso.fr). A defaut d'accord amiable, tout litige releve du Tribunal judiciaire de Douai.");
y=sep(y);
// XXII annexes
y=artTitle(y,'XXII','ANNEXES OBLIGATOIRES');
var ann=["La notice d'information du locataire (arrete du 29 mai 2015) ;","Le Dossier de Diagnostic Technique (DPE, ERP, CREP, amiante, electricite, gaz) ;","L'etat des lieux d'entree contradictoire ;","L'extrait du reglement de copropriete, si copropriete ;","L'attestation d'assurance habitation du Locataire ;"];
if(gar==='caution')ann.push("Les actes de cautionnement (un par caution) avec mention manuscrite art. 2297 ;");
if(gar==='visale')ann.push("Le visa VISALE ;");
if(isMeuble)ann.push("L'inventaire du mobilier (decret 2015-981) ;");
ann.push("La grille de vetuste de l'Institut National de la Consommation.");
ann.forEach(function(b){y=bullet(y,b);});

// SIGNATURES
y=newPage();
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(11);doc.text('Ratification',PDF_W/2,y,{align:'center'});y+=7;
doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(18);doc.text('S I G N A T U R E S',PDF_W/2,y,{align:'center'});y+=8;
y=para(y,"Fait a Douai, le "+g('date','DATE')+", etabli et signe par voie electronique via ATRIUM ; original electronique unique dont chaque Partie recoit une copie.",{align:'center',style:'italic',color:C_OR_SOMBRE});
y=legalBox(y,"Mention manuscrite (art. 1376 C. civ.)","Chaque signataire fait preceder sa signature de \"Lu et approuve, bon pour bail\". Les cautions portent en outre la mention des articles 2297 et 2298 du Code civil.",false);y+=4;
var cw=52,gap=(CONTENT_W-3*cw)/2,ch=48;
cartouche(MARGIN_L,y,cw,ch,{titre:'LE BAILLEUR',sous:'Bailleur',fil:['Lu et approuve','bon pour bail'],nom:'',qual:'Le Bailleur'});
cartouche(MARGIN_L+cw+gap,y,cw,ch,{titre:'LE LOCATAIRE',sous:'Locataire',fil:(d.signed?['Lu et approuve, bon pour bail']:['Lu et approuve','bon pour bail']),signName:(d.signed?(d._locSig||''):''),nom:(d.signed?(d._locName||''):''),qual:(prof==='coloc'?'Tous colocataires':'Le Locataire')});
cartouche(MARGIN_L+2*(cw+gap),y,cw,ch,{titre:'LE MANDATAIRE',sous:'Le Temple - ATRIUM',fil:[],stamp:!!d.signed,signImg:(d.signed?(d._sigPng||null):null),signName:(d.signed&&!d._sigPng?'M. Zazoua':''),nom:'M. ZAZOUA Mohammed',qual:'Gerant'});

// NOTICE D'INFORMATION (annexe obligatoire)
y=newPage();
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(11);doc.text('Annexe obligatoire',PDF_W/2,y,{align:'center'});y+=7;
doc.setTextColor.apply(doc,C_NOIR);doc.setFont('times','normal');doc.setFontSize(13);doc.text('N O T I C E   D \' I N F O R M A T I O N   D U   L O C A T A I R E',PDF_W/2,y,{align:'center'});y+=5;
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(9);doc.text('Arrete du 29 mai 2015 (NOR : ETLL1511199A)',PDF_W/2,y,{align:'center'});y+=7;
var notice=[["1. Cadre legal","Contrat regi par la loi 89-462 du 6 juillet 1989 et le decret 2015-587 ; residence principale du locataire."],["2. Duree","Personne physique/SCI familiale : 3 ans ; personne morale : 6 ans. Meuble : 1 an (9 mois etudiant). Mobilite : 1 a 10 mois. Tacite reconduction sauf conge."],["3. Loyer","Fixe librement sauf zone tendue (encadrement). Revision annuelle plafonnee a l'IRL (INSEE)."],["4. Charges","Provision regularisee annuellement, ou forfait (mobilite). Charges recuperables : decret 87-713. Taxe fonciere et grosses reparations a la charge du bailleur."],["5. Depot de garantie","Nu : 1 mois. Meuble/etudiant : 2 mois. Mobilite : interdit. Restitution sous 1 ou 2 mois ; majoration 10 %/mois de retard."],["6. Assurance","Le locataire s'assure contre les risques locatifs (art. 7 g) et justifie chaque annee."],["7. Etat des lieux","Contradictoire a l'entree et a la sortie ; delai de 10 jours pour completer ; a defaut, commissaire de justice (frais partages)."],["8. Reparations locatives","Decret 87-712 : entretien courant, chaudiere, VMC a la charge du locataire ; vetuste et vices a la charge du bailleur."],["9. Resiliation et conges","Conge locataire : 3 mois (1 mois cas legaux). Conge bailleur : 6 mois, pour vente, reprise ou motif legitime et serieux. Locataires ages proteges."],["10. Recours","Reclamation ecrite ; mediation GIE MEDIMMOCONSO ; ADIL du Nord ; commission de conciliation ; TJ de Douai. Aides : APL/ALS, VISALE, FSL, Loca-Pass."],["11. RGPD","Donnees traitees pour l'execution du bail ; droits d'acces, rectification, effacement, opposition ; reclamation CNIL."],["12. Conservation","Conservez le bail signe, les etats des lieux, quittances, attestation d'assurance et toute correspondance."]];
notice.forEach(function(n){y=chk(y,13);doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(9.5);doc.text(n[0],MARGIN_L,y);y+=4.6;y=para(y,n[1],{size:9.8,lh:4.7});y+=1.5;});
// MODULES CAUTIONNEMENT (un acte par caution si garantie = caution)
if(gar==='caution'){var _cs=cautions.length?cautions:[{}];for(var ci=0;ci<_cs.length;ci++){(function(cau,idx,tot){
y=newPage();
doc.setFillColor.apply(doc,C_NOIR);doc.rect(MARGIN_L-2,y-5,CONTENT_W+4,9,'F');doc.setTextColor.apply(doc,C_OR_ECLAT);doc.setFont('times','normal');doc.setFontSize(10);doc.text('ANNEXE - ACTE DE CAUTIONNEMENT SOLIDAIRE'+(tot>1?(' ('+(idx+1)+'/'+tot+')'):''),PDF_W/2,y+0.5,{align:'center'});y+=10;
doc.setTextColor.apply(doc,C_OR_SOMBRE);doc.setFont('times','italic');doc.setFontSize(9);doc.text('A jour de la reforme des suretes (ordonnance 2021-1192)',PDF_W/2,y,{align:'center'});y+=7;
var cnom=cau.nom||'<NOM DE LA CAUTION>';var cplaf=cau.plafond||'<PLAFOND>';var crev=cau.revenus||'<REVENUS>';var cdur=cau.duree||'duree du bail';
y=fieldTable(y,[["Bailleur (creancier garanti)",g('bailleur_nom','NOM')],["La Caution",cnom],["Domicile / naissance",(cau.adresse||'<ADRESSE>')+(cau.naissance?(' - ne(e) le '+cau.naissance):'')],["Revenus nets declares",crev+" EUR"],["Locataire cautionne",g('locataire','NOM(S)')],["Plafond garanti",cplaf+" EUR"]]);
y=artTitle(y,'I','NATURE ET ETENDUE');
y=para(y,"La Caution "+cnom+" se porte caution solidaire du Locataire et renonce au benefice de discussion (art. 2305) et de division (art. 2306). Le cautionnement couvre loyers, charges, indemnites d'occupation, reparations locatives, interets et frais mis a la charge du Locataire par decision de justice, dans la limite de "+cplaf+" EUR (principal, interets, penalites, accessoires). Duree : "+cdur+".");
y=artTitle(y,'II','INFORMATION DE LA CAUTION');
["Remise d'un exemplaire du bail garanti (art. 22-1).","Information de tout incident de paiement.","Avis dans les 15 jours du commandement de payer (art. 24).","Information annuelle au 31 mars (art. 2302 C. civ.)."].forEach(function(b){y=bullet(y,b);});
y=artTitle(y,'III','MENTION MANUSCRITE (ART. 2297)');
y=para(y,"A peine de nullite, la Caution appose de sa main, avant sa signature, la mention exprimant la nature et la portee de son engagement.");
y=legalBox(y,"Modele a recopier de la main de la Caution","Je me porte caution solidaire de "+g('locataire','LOCATAIRE(S)')+", dans la limite de "+cplaf+" EUR couvrant le paiement du principal, des interets et, le cas echeant, des penalites et interets de retard. Je m'engage a rembourser le Bailleur sur mes revenus et mes biens si "+g('locataire','LOCATAIRE(S)')+" n'y satisfait pas lui-meme. En renoncant au benefice de discussion defini a l'article 2305 du Code civil et en m'obligeant solidairement, je m'engage a rembourser le Bailleur sans pouvoir exiger qu'il poursuive prealablement le Locataire.",false);
y=chk(y+4,54);
cartouche(MARGIN_L,y,cw,ch,{titre:'LA CAUTION',sous:'Caution solidaire',fil:(d.signed?['Mention art. 2297 recopiee']:['Mention art. 2297','puis Lu et approuve']),signName:(d.signed?cnom:''),nom:cnom,qual:'Caution'});
cartouche(MARGIN_L+cw+gap,y,cw,ch,{titre:'LE BAILLEUR',sous:'Creancier garanti',fil:['Lu et approuve'],nom:'',qual:'Le Bailleur'});
cartouche(MARGIN_L+2*(cw+gap),y,cw,ch,{titre:'LE MANDATAIRE',sous:'Le Temple',fil:[],stamp:!!d.signed,signImg:(d.signed?(d._sigPng||null):null),signName:(d.signed&&!d._sigPng?'M. Zazoua':''),nom:'M. ZAZOUA Mohammed',qual:'Gerant'});
})(_cs[ci],ci,_cs.length);}}
// footers
var np=doc.getNumberOfPages();for(var i=2;i<=np;i++){doc.setPage(i);footIn(i-1);if(d.signed){_drawParaphes(doc,d._locPar||'MZ',d._cabPar||'LT');}}
return doc;
}
if(typeof module!=='undefined')module.exports={buildBail:buildBail};
