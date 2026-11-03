// Pose curves and joint pivots from Gofish-Mascot-HD v9 (expanded motion).
// Time here is the original design timeline. The player maps elapsed time once.
const TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const pivots={torso:[400,620],'leg-left':[315,552],'leg-right':[485,552],'foot-left':[300,640],'foot-right':[498,643],'wing-left':[270,422],'wing-right':[526,453],'wing-left-open':[278,440],'wing-right-open':[504,439],ball:[251,484]};
export function pose(id,ms,duration){
  const t=Math.max(0,Math.min(duration,ms))/1000,D=duration/1000,u=t/D,w=TAU*u;
  const e=ease(t/.65)*ease((D-t)/.65),s=(n=1)=>Math.sin(w*n),c=(n=1)=>Math.cos(w*n);
  const breath=.5-.5*c(Math.max(1,Math.round(D/4)));
  const p={root:{x:0,y:0,a:0,sx:1,sy:1},body:{y:0,a:0,sy:1+.005*breath},head:{x:0,y:-2*breath,a:0,sx:1,sy:1,face:'base'},left:{mode:'held',a:0,x:0,y:0,s:1,front:true},right:{mode:'wave',a:1.25,x:0,y:0,s:.88,front:false},legs:[{a:0,x:0,y:0,foot:0},{a:0,x:0,y:0,foot:0}],ball:{x:251,y:484,a:0,sx:1,sy:1},floorBall:false};
  if((t>2.12&&t<2.25)||(D>7&&t>6.24&&t<6.37))p.head.face='blink';
  switch(id){
    case 'idle':p.head.a=.024*s(2);p.right.a+=.05*s(2);break;
    case 'wave':p.right.a=1.25-e*(1.6+.34*s(5));p.right.s=.88+.18*e;p.head.a=-.05*e+.03*s(3)*e;p.body.a=.024*s(3)*e;p.root.x=4*s(3)*e;break;
    case 'blink':p.head.a=.12*s(2)*e;p.head.x=3*s(2)*e;p.head.face=((u>.25&&u<.31)||(u>.66&&u<.72))?'blink':'base';p.right.a+=.11*s(2)*e;break;
    case 'jump':{
      const start=.6,end=D-.6,cycles=Math.max(1,Math.round((end-start)/1.6));
      const q=((t-start)/(end-start)*cycles%1+1)%1;
      // Lower the ready stance slightly to leave headroom for a larger leap.
      p.root.y=18*e;
      if(t>start&&t<end){
        if(q<.18){const v=Math.sin(Math.PI*q/.18);p.root.y=18*e+14*v;p.root.sy=1-.065*v;p.root.sx=1+.04*v;}
        else if(q<.78){const air=Math.sin(Math.PI*(q-.18)/.6);p.root.y=18*e-140*air;p.right.a=1.25-1.75*air;p.right.s=.88+.2*air;p.legs[0].a=-.20*air;p.legs[1].a=.20*air;p.legs[0].y=p.legs[1].y=-11*air;}
        else {const v=Math.sin(Math.PI*(q-.78)/.22);p.root.sy=1-.08*v;p.root.sx=1+.05*v;}
      }break;}
    case 'dribble':{
      const q=(u*8)%1,fall=(2*q-1)*(2*q-1),impact=Math.pow(Math.abs(2*q-1),18);
      p.left={mode:'open',a:-.86+.32*Math.cos(TAU*q),x:0,y:18*e*Math.cos(TAU*q),s:1,front:true};
      p.ball.x=251+(190-251)*e;p.ball.y=484+e*(418+195*fall-484);p.ball.a=w*3*e;p.ball.sx=1+.08*impact*e;p.ball.sy=1-.11*impact*e;p.body.y=3.5*Math.cos(TAU*q)*e;p.head.a=-.04*e;break;}
    case 'toss':{
      const q=(u*4)%1,flight=Math.sin(Math.PI*q),arc=4*q*(1-q);
      p.left={mode:'open',a:-1.0+1.25*flight*e,x:0,y:-12*flight*e,s:1,front:true};
      p.ball.x=251-158*flight*e;p.ball.y=484-470*arc*e;p.ball.a=w*2*e;p.head.a=-.08*flight*e;p.head.y=-7*flight*e;p.right.a=1.25-.35*e;break;}
    case 'dance':p.root.x=24*s(3)*e;p.root.y=-4*Math.abs(s(6))*e;p.body.a=.075*s(6)*e;p.head.a=-.075*s(6)*e;p.right.a=1.25-e*(.70+.60*s(6));p.legs[0].a=.23*s(6)*e;p.legs[1].a=-.23*s(6)*e;p.legs[0].y=-20*Math.max(0,s(6))*e;p.legs[1].y=-20*Math.max(0,-s(6))*e;break;
    case 'cheer':p.right.a=1.25-e*(1.85+.22*s(4));p.right.s=.88+.18*e;p.root.y=-38*Math.max(0,s(4))*e;p.head.face=e>.65?'laugh':'base';p.head.a=.04*s(4)*e;break;
    case 'think':p.right.a=1.25-2.68*e;p.right.x=-30*e;p.right.y=13*e;p.right.s=.85;p.right.front=true;p.head.a=-.095*e+.03*s(2)*e;p.head.y=5*e;break;
    case 'surprise':p.head.face=e>.7?'surprise':'base';p.root.a=-.055*e;p.root.x=-7*e;p.head.y=-14*e;p.head.sy=1+.04*e;p.right.a=1.25-1.45*e;p.right.s=.88+.18*e;p.root.y=-9*e;break;
    case 'sleep':p.head.face=e>.5?'sleep':'base';p.head.a=.17*e+.025*s(3)*e;p.head.y=12*e;p.body.y=7*e;p.body.sy=1-.032*e+.008*breath;p.right.a=1.25+.18*e;p.right.s=.88-.05*e;break;
    case 'bow':{const bow=(.5-.5*c(2))*e;p.head.a=.19*bow;p.head.y=40*bow;p.head.sy=1-.16*bow;p.head.face=bow>.65?'blink':'base';p.body.a=.065*bow;p.body.y=12*bow;p.right.a=1.25-2.55*bow;p.right.x=-28*bow;p.right.front=true;break;}
    case 'walk':case 'jog':{
      const fast=id==='jog',n=fast?12:10,v=s(n),amp=fast?.32:.20;
      p.legs[0].a=amp*v*e;p.legs[1].a=-amp*v*e;p.legs[0].y=-(fast?26:14)*Math.max(0,v)*e;p.legs[1].y=-(fast?26:14)*Math.max(0,-v)*e;p.legs[0].foot=.14*v*e;p.legs[1].foot=-.14*v*e;
      p.root.y=-(fast?17:8)*Math.abs(v)*e;p.body.a=(fast?.05:.03)*e;p.head.a=-p.body.a;p.right.a=1.25+(fast?.58:.33)*v*e;break;}
    case 'peek':p.root.x=28*s(2)*e;p.head.x=15*s(2)*e;p.head.a=.10*s(2)*e;p.body.a=.04*s(2)*e;p.right.a=1.25-.55*(.5-.5*c(2))*e;break;
    case 'point':p.right.mode='open';p.right.a=1.25-e*(1.5+.32*s(2));p.right.s=.88+.10*e;p.head.a=.065*e;p.head.x=8*e;break;
    case 'stretch':p.floorBall=true;p.left={mode:'open',a:-1.2+1.55*e+.10*s(2)*e,x:0,y:-13*e,s:1,front:false};p.right={mode:'open',a:1.25-1.80*e-.10*s(2)*e,x:0,y:-13*e,s:1,front:false};p.body.sy=1+.06*e+.009*s(2)*e;p.head.y=-20*e-4*s(2)*e;p.head.a=.026*s(2)*e;p.head.face=e>.7?'blink':'base';p.ball.x=251-97*e;p.ball.y=484+139*e;p.ball.sx=p.ball.sy=1-.15*e;p.ball.a=-.7*e;break;
    case 'yawn':p.head.face=e>.7?'laugh':'base';p.head.a=-.065*e;p.head.sy=1+.03*e;p.right.a=1.25-2.75*e;p.right.x=-38*e;p.right.y=-12*e;p.right.s=.88+.26*e;p.right.front=true;p.body.sy=1+.028*e;break;
    case 'laugh':p.head.face=e>.6?'laugh':'base';p.head.y=-8*Math.abs(s(7))*e;p.head.a=.04*s(4)*e;p.body.y=6*Math.abs(s(7))*e;p.body.sy=1-.022*Math.abs(s(7))*e;p.right.a=1.25-2.35*e;p.right.x=-23*e;p.right.front=true;break;
    case 'shy':p.floorBall=true;p.left={mode:'open',a:-1.2+2.42*e,x:0,y:0,s:1,front:true};p.right={mode:'open',a:1.25-2.58*e,x:-10*e,y:0,s:1,front:true};p.head.face=e>.5?'blink':'base';p.head.a=-.105*e;p.head.y=10*e;p.root.x=4*s(2)*e;p.body.a=.016*s(2)*e;p.ball.x=251-97*e;p.ball.y=484+139*e;p.ball.sx=p.ball.sy=1-.15*e;break;
    case 'highfive':p.right.a=1.25-1.8*e;p.right.s=.88+.45*(.65+.35*s(3))*e;p.right.x=-5*e;p.right.front=true;p.root.y=-7*(.5-.5*c(3))*e;p.head.a=-.04*e;break;
    case 'nod':p.head.a=.08*s(4)*e;p.head.y=15*s(4)*e;p.head.sy=1-.05*Math.max(0,s(4))*e;p.right.a+=.06*s(4)*e;break;
    case 'shake':p.head.a=.12*s(4)*e;p.head.x=21*s(4)*e;p.body.a=-.012*s(4)*e;p.right.a=1.25-.18*e;break;
    case 'groom':p.right.a=1.25-e*(2.2+.16*s(4));p.right.x=-17*e;p.right.y=-30*e;p.right.s=.88+.25*e;p.right.front=true;p.head.a=-.09*e;p.head.y=4*e;break;
  }
  return p;
}
// Draw exactly one skeleton. All coordinates below are in the original 768px rig.
export function drawPose(ctx, images, p) {
  const scale = ctx.canvas.width / 768;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, 768, 768);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.save();
  ctx.translate(400 + p.root.x, 690 + p.root.y);
  ctx.rotate(p.root.a);
  ctx.scale(.88 * p.root.sx, .88 * p.root.sy);
  ctx.translate(-400, -690);

  function part(name, pivot, x, y, angle = 0, sx = 1, sy = sx) {
    const { image, box } = images.get(name);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(sx, sy);
    ctx.translate(-pivot[0], -pivot[1]);
    ctx.drawImage(image, box[0], box[1], box[2], box[3]);
    ctx.restore();
  }

  for (const [i, side] of ['left', 'right'].entries()) {
    const leg = p.legs[i];
    const joint = pivots['leg-' + side];
    const ankle = pivots['foot-' + side];
    ctx.save();
    ctx.translate(joint[0] + leg.x, joint[1] + leg.y);
    ctx.rotate(leg.a);
    ctx.translate(-joint[0], -joint[1]);
    part('foot-' + side, ankle, ...ankle, leg.foot);
    part('leg-' + side, joint, ...joint);
    ctx.restore();
  }

  function bodyTransform(weight) {
    ctx.translate(400, 620 + p.body.y * weight);
    ctx.rotate(p.body.a * weight);
    ctx.scale(1, 1 + (p.body.sy - 1) * weight);
    ctx.translate(-400, -620);
  }
  function wing(side) {
    const v = p[side];
    const name = wingPart(side, v);
    const x = (side === 'left' ? 270 : 545) + v.x;
    const y = (side === 'left' ? 435 : 453) + v.y;
    part(name, pivots[name], x, y, v.a, v.s);
  }
  function ball() {
    const b = p.ball;
    part('ball', pivots.ball, b.x, b.y, b.a, b.sx, b.sy);
  }

  ctx.save();
  bodyTransform(1);
  if (!p.left.front) wing('left');
  if (!p.right.front) wing('right');
  part('torso', pivots.torso, ...pivots.torso);
  ctx.restore();

  // Shy/stretch set the ball down. Blend its attachment to the body
  // continuously during an interruption, drawing it on only one depth plane.
  const bodyWeight = p.ballBodyWeight;
  if (!p.floorBall) {
    ctx.save();
    bodyTransform(bodyWeight);
    ball();
    ctx.restore();
  }
  ctx.save();
  bodyTransform(1);
  part('head-' + p.head.face, [401, 395], 401 + p.head.x, 395 + p.head.y,
    p.head.a, p.head.sx, p.head.sy);
  if (p.left.front) wing('left');
  if (p.right.front) wing('right');
  ctx.restore();
  if (p.floorBall) {
    ctx.save();
    bodyTransform(bodyWeight);
    ball();
    ctx.restore();
  }
  ctx.restore();
}

export function wingPart(side, wing) {
  return 'wing-' + side + (wing.mode === 'open' ? '-open' : '');
}
