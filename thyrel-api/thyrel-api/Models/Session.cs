﻿using System;
using System.Collections.Generic;

namespace thyrel_api.Models
{
    public class Session
    {
        public Session()
        {
        }

        public Session(DateTime? finishAt, int roomId, int? currentAlbumId, DateTime stepFinishAt, int timeDuration,
            SessionStepType stepType, int totalPlayers)
        {
            FinishAt = finishAt;
            CreatedAt = DateTime.Now;
            RoomId = roomId;
            CurrentAlbumId = currentAlbumId;
            ActualStep = 1;
            StepFinishAt = stepFinishAt;
            TimeDuration = timeDuration;
            StepType = stepType;
            TotalPlayers = totalPlayers;
        }

        public int Id { get; set; }
        public DateTime? FinishAt { get; set; }
        public DateTime? StepFinishAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TimeDuration { get; set; }
        public int ActualStep { get; set; }
        public SessionStepType StepType { get; set; }
        public int TotalPlayers { get; set; }

        public int? CurrentAlbumId { get; set; }

        public int RoomId { get; set; }
        public virtual Room Room { get; set; }

        public virtual List<Element> Elements { get; set; }

        public void UpdateTimeForStep(int time)
        {
            if (time == 0) return;
            StepFinishAt = DateTime.Now.AddSeconds(time);
            TimeDuration = time;
        }
    }
}