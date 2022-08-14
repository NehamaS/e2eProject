Feature: mMCU Cluster Health - video =>

  @TMU-18470
  @stream
  @sanity
  @video
  Scenario: stream - 1 sender, 1 receiver
    Given System is running on MCU_HOME
    Given create conference 200001
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |userType |
      | chandler    | context   | audio-video   |receiver |
 #   When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType    | userType |
  #    | chandler    | context   | data-channel  | receiver  |
      | ross        | context   | audio-video | sender   |
   #   | ross        | context   | data-channel | receiver |
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType       | streamFile |
      | chandler    | context    | audio-video    | audio1     |
      | ross        | context    | audio-video    | video3     |
    Then Sleep 12 sec in case STREAM_V set to TRUE
    And leave participant:
      | Participant | meetingID | roomType    |
    #  | ross        | context   | data-channel  |
    #  | chandler    | context   | data-channel |
      | ross        | context   | audio-video |
      | chandler    | context   | audio-video |
    And validate stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
    And stop stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
   # Then destroy data-channel room
    Then destroy audio room

  @TMU-18472
  @video
  @stream
  Scenario: stream - 2 senders
    Given System is running on MCU_HOME
    Given create conference 200002
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |userType |
      | chandler    | context   | audio-video   |sender |
#    When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType    | userType |
 #     | chandler    | context   | data-channel  | receiver  |
      | ross        | context   | audio-video | sender   |
  #    | ross        | context   | data-channel | receiver |
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType | streamFile |
      | chandler    | context    | audio-video    | video1     |
      | ross        | context    | audio-video    | video3     |
    Then Sleep 12 sec in case STREAM_V set to TRUE:
    And leave participant:
      | Participant | meetingID | roomType    |
   #   | ross        | context   | data-channel  |
   #   | chandler    | context   | data-channel |
      | ross        | context   | audio-video |
      | chandler    | context   | audio-video |
    And validate stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
    And stop stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
   # Then destroy data-channel room
    Then destroy audio room

  @TMU-18545
  @video
  @stream
  Scenario: multi-stream - 2 senders
    Given System is running on MCU_HOME
    Given create conference 200003
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |userType     |
      | chandler    | context   | audio-video   |multi-sender |
   # When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType    | userType     |
   #   | chandler    | context   | data-channel  | receiver     |
      | ross        | context   | audio-video | multi-sender |
    #  | ross        | context   | data-channel | receiver     |
#    And start stream in case STREAM set to TRUE:
#      | Participant | meetingID  | roomType | streamFile |
#      | chandler    | context    | audio-video    | video1     |
#      | ross        | context    | audio-video    | video3     |
   # Then Sleep 12 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType    |
     # | ross        | context   | data-channel  |
     # | chandler    | context   | data-channel |
      | ross        | context   | audio-video |
      | chandler    | context   | audio-video |
#    And validate stream in case STREAM set to TRUE:
#      | Participant | meetingID  | roomType |
#      | chandler    | context    | audio-video    |
#      | ross        | context    | audio-video    |
#    And stop stream in case STREAM set to TRUE:
#      | Participant | meetingID  | roomType |
#      | chandler    | context    | audio-video    |
#      | ross        | context    | audio-video    |
   # Then destroy data-channel room
    Then destroy audio room

  @TMU-18893
  @video
  @stream
  Scenario: open and close camera - reInvite
    Given System is running on MCU_HOME
    Given create conference 200004
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |userType | port  |
      | chandler    | context   | audio-video   |receiver | 20004 |
   # When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType    | userType |
    #  | chandler    | context   | data-channel  | receiver  |
      | ross        | context   | audio-video | sender   |
    #  | ross        | context   | data-channel | receiver |
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType     | streamFile |
      | chandler    | context    | audio-video  | audio3     |
      | ross        | context    | audio-video  | video2     |
    Then Sleep 15 sec in case STREAM_V set to TRUE
    And chandler reInvite in audio-video roomType as sender
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType    | streamFile |
      | chandler    | context    | audio-video | video3     |
    Then Sleep 15 sec in case STREAM_V set to TRUE
    And chandler reInvite in audio-video roomType as receiver
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType    | streamFile |
      | chandler    | context    | audio-video | audio1     |
    Then Sleep 15 sec in case STREAM_V set to TRUE
    And leave participant:
      | Participant | meetingID | roomType    |
     # | ross        | context   | data-channel  |
     # | chandler    | context   | data-channel |
      | ross        | context   | audio-video |
      | chandler    | context   | audio-video |
    And validate stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
    And stop stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
   # Then destroy data-channel room
    Then destroy audio room

  @TMU-19541
  @video
  @stream
  Scenario: user open camera twice - 2 reInvite with same sdp
    Given System is running on MCU_HOME
    Given create conference 200005
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |userType |port  |
      | chandler    | context   | audio-video   |receiver |20005 |
   # When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType    | userType |
      #| chandler    | context   | data-channel  | receiver  |
      | ross        | context   | audio-video | sender   |
     # | ross        | context   | data-channel | receiver |
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType     | streamFile |
      | chandler    | context    | audio-video  | audio3     |
      | ross        | context    | audio-video  | video2     |
    Then Sleep 10 sec in case STREAM_V set to TRUE
  #open camera
    And chandler reInvite in audio-video roomType as sender
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType    | streamFile |
      | chandler    | context    | audio-video | video3     |
    Then Sleep 10 sec in case STREAM_V set to TRUE
   ##open camera
    And chandler reInvite in audio-video roomType as sender
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType    | streamFile |
      | chandler    | context    | audio-video | video3     |
    Then Sleep 10 sec in case STREAM_V set to TRUE
    And leave participant:
      | Participant | meetingID | roomType    |
     # | ross        | context   | data-channel |
    #  | chandler    | context   | data-channel  |
      | ross        | context   | audio-video |
      | chandler    | context   | audio-video |
    And validate stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
    And stop stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
   # Then destroy data-channel room
    Then destroy audio room


  @TMU-19542
  @video
  @PSTN
  @stream
#   stream verification verify that PSTN user has audio record and has no video record
  Scenario: start camera when there is a PSTN user in the video room
    Given System is running on MCU_HOME
    Given create conference 200006
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |userType |port    |
      | chandler    | context   | audio-video   |receiver |20006   |
   # When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType    | userType | deviceType |
    #  | chandler    | context   | data-channel  | receiver |            |
      | ross        | context   | audio-video | pstn     | PSTN       |
    #  | ross        | context   | data-channel | pstn     | PSTN       |
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType     | streamFile |
      | chandler    | context    | audio-video  | audio1     |
      | ross        | context    | audio-video  | audio2     |
    Then Sleep 10 sec in case STREAM_V set to TRUE
    And chandler reInvite in audio-video roomType as sender
    And start stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType     | streamFile |
      | chandler    | context    | audio-video  | video3     |
    Then Sleep 10 sec in case STREAM_V set to TRUE
    And leave participant:
      | Participant | meetingID | roomType    |
     # | ross        | context   | data-channel  |
     # | chandler    | context   | data-channel |
      | ross        | context   | audio-video |
      | chandler    | context   | audio-video |
    And validate stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
    And stop stream in case STREAM_V set to TRUE:
      | Participant | meetingID  | roomType |
      | chandler    | context    | audio-video    |
      | ross        | context    | audio-video    |
   # Then destroy data-channel room
    Then destroy audio room

  @TMU-19543
  @video
  @PSTN
  Scenario: No Error when PSTN user join as video sender
    Given System is running on MCU_HOME
    Given create conference 200007
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |userType |
      | chandler    | context   | audio-video   |sender |
   # When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType    | userType | deviceType |
     # | chandler    | context   | data-channel  | receiver  |            |
      | ross        | context   | audio-video | sender   | PSTN       |
     # | ross        | context   | data-channel | receiver |            |
    #Then destroy data-channel room
    Then destroy audio room


  @TMU-19544
  @error-test
  @video
  Scenario: reInvite With UnknownToTagAndCallID - Expected to get succeed response on header
    Given System is running on MCU_HOME
    Given create conference 200008
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |
      | chandler    | context   | audio         |
    And add non-standart participant ross in meetingID context with userType RECEIVER and deviceType PC_CLIENT with header case reInviteWithUnknownToTagAndCallID
    And leave participant:
      | Participant | meetingID | roomType      |
      | ross        | context   | audio         |
      | chandler    | context   | audio         |
    Then destroy audio room

  @TMU-19545
  @error-test
  @video
  Scenario: sendrecv direction in video RecvOnly mid - return Error on SDP
    Given System is running on MCU_HOME
    Given create conference 200009
    When create audio room for host chandler
    And add participant chandler in meetingID context with roomType audio with sdp error SENDRECV_DIRECTION_IN_VIDEO_RECVONLY_MID
    Then chandler should get errorCode: 500, errorReason: Create Video Track Failed response on INVITE audio roomType
    Then destroy audio room

  @TMU-19546
  @error-test
  @video
  Scenario: VP9 codec in video RecvOnly mid - Expected to get succeed response on SDP
    Given System is running on MCU_HOME
    Given create conference 200010
    When create audio room for host chandler
    And add participant chandler in meetingID context with roomType audio with sdp case VP9_CODEC_IN_VIDEO_MID
    Then destroy audio room


